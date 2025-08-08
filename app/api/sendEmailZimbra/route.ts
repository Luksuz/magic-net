import { NextResponse } from 'next/server'

function createHtmlTemplate(subject: string, message: string): string {
  // If message already looks like HTML, keep as-is but still wrap minimal container
  const seemsHtml = /<\w+[^>]*>/.test(message)
  const formattedMessage = seemsHtml
    ? message
    : message
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map(
          (line) =>
            `<p style="margin-bottom: 18px; line-height: 1.7; color: #374151; font-size: 16px;">${line.replace(
              /\s{2,}/g,
              ' '
            )}</p>`
        )
        .join('')

  return `<!DOCTYPE html>
  <html lang="hr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>
      body { margin:0; font-family: Arial, sans-serif; background-color:#ffffff; color:#374151; }
      .email-content { max-width:800px; margin:0 auto; font-size:16px; line-height:1.7; }
      h1 { font-size:20px; margin:0 0 16px; }
    </style>
  </head>
  <body>
    <div class="email-content">
      ${formattedMessage}
    </div>
  </body>
  </html>`
}

export async function POST(req: Request) {
  try {
    const soapUrl = process.env.ZIMBRA_SOAP_URL
    const fromEmail = process.env.ZIMBRA_EMAIL

    if (!soapUrl || !fromEmail) {
      return NextResponse.json({ error: 'Missing Zimbra configuration (ZIMBRA_SOAP_URL, ZIMBRA_EMAIL)' }, { status: 500 })
    }

    const { recipient, subject, message, authToken, attachments } = await req.json()

    if (!recipient || !subject || !message) {
      return NextResponse.json({ error: 'recipient, subject and message are required' }, { status: 400 })
    }

    const htmlBody = createHtmlTemplate(subject, message)

    // Upload attachments first to Zimbra and collect upload IDs
    let attachAid = ''
    if (Array.isArray(attachments) && attachments.length > 0) {
      const uploadUrl = (() => {
        const u = new URL(soapUrl)
        u.pathname = '/service/upload'
        u.search = 'fmt=raw'
        return u.toString()
      })()

      const ids: string[] = []
      for (const att of attachments as Array<{ name: string; content: string }>) {
        const dataUrl = att?.content || ''
        let contentType = 'application/octet-stream'
        let base64Data = ''
        const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl)
        if (m) {
          contentType = m[1]
          base64Data = m[2]
        } else {
          base64Data = dataUrl
        }

        const buffer = Buffer.from(base64Data, 'base64')
        const blob = new Blob([buffer], { type: contentType })

        const form = new FormData()
        // Zimbra expects the field name to be 'file'
        form.append('file', blob, att?.name || 'attachment')

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            // Auth via cookie
            Cookie: `ZM_AUTH_TOKEN=${authToken ?? ''}`,
          },
          body: form as any,
        })

        const uploadText = await uploadRes.text()

        // Handle auth faults on upload
        const authFault =
          uploadRes.status === 401 ||
          /AUTH_REQUIRED/i.test(uploadText) ||
          /no valid authtoken present/i.test(uploadText)
        if (authFault) {
          return NextResponse.json({ error: 'UNAUTHORIZED', details: uploadText }, { status: 401 })
        }

        if (!uploadRes.ok) {
          return NextResponse.json({ error: 'Upload failed', details: uploadText }, { status: uploadRes.status })
        }

        // Parse upload id(s)
        // Case 1: XML: <upload><id>...</id></upload>
        const idMatchXml = uploadText.match(/<id>([^<]+)<\/id>/)
        if (idMatchXml) {
          ids.push(idMatchXml[1])
        } else {
          // Case 2: Plain response like: 200,'filename','aid' OR 200,'null','aid'
          // Extract quoted tokens and take the last one as aid
          const tokens = [...uploadText.matchAll(/'([^']*)'/g)].map(m => m[1])
          const aidToken = tokens.length >= 1 ? tokens[tokens.length - 1] : ''
          if (!aidToken) {
            return NextResponse.json({ error: 'Upload id not found', details: uploadText }, { status: 500 })
          }
          ids.push(aidToken)
        }
      }
      attachAid = ids.join(',')
    }

    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <context xmlns="urn:zimbra">
      <authToken>${authToken ?? ''}</authToken>
    </context>
  </soap:Header>
  <soap:Body>
    <SendMsgRequest xmlns="urn:zimbraMail">
      <m>
        <e t="t" a="${recipient}"/>
        <su>${escapeXml(subject)}</su>
        <mp ct="text/html"><content><![CDATA[${htmlBody}]]></content></mp>
        ${attachAid ? `<attach aid="${attachAid}"/>` : ''}
      </m>
    </SendMsgRequest>
  </soap:Body>
</soap:Envelope>`

    const res = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
      },
      body: envelope,
    })

    const text = await res.text()

    // If unauthorized, propagate error so client can refresh token
    // Zimbra often returns 200 with SOAP Fault body; detect both cases
    const isAuthFault =
      res.status === 401 ||
      /AUTH_REQUIRED/i.test(text) ||
      /no valid authtoken present/i.test(text) ||
      /<soap:Fault[\s\S]*?>[\s\S]*?<Code>service\.AUTH_REQUIRED<\/Code>/i.test(text)

    if (isAuthFault) {
      return NextResponse.json({ error: 'UNAUTHORIZED', details: text }, { status: 401 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to send email', details: text }, { status: res.status })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Zimbra send email error:', error)
    return NextResponse.json({ error: 'Zimbra send email failed' }, { status: 500 })
  }
}

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
