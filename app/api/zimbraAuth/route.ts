import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const soapUrl = process.env.ZIMBRA_SOAP_URL
    const email = process.env.ZIMBRA_EMAIL
    const password = process.env.ZIMBRA_PASSWORD

    if (!soapUrl || !email || !password) {
      return NextResponse.json({ error: 'Missing Zimbra configuration (ZIMBRA_SOAP_URL, ZIMBRA_EMAIL, ZIMBRA_PASSWORD)' }, { status: 500 })
    }

    const authEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <AuthRequest xmlns="urn:zimbraAccount">
      <account by="name">${email}</account>
      <password>${password}</password>
    </AuthRequest>
  </soap:Body>
</soap:Envelope>`

    const res = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
      },
      body: authEnvelope,
    })

    const text = await res.text()

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to authenticate with Zimbra', details: text }, { status: res.status })
    }

    const tokenMatch = text.match(/<authToken>([\s\S]*?)<\/authToken>/)
    if (!tokenMatch) {
      return NextResponse.json({ error: 'authToken not found in Zimbra response', raw: text }, { status: 500 })
    }

    const authToken = tokenMatch[1]
    return NextResponse.json({ authToken }, { status: 200 })
  } catch (error) {
    console.error('Zimbra auth error:', error)
    return NextResponse.json({ error: 'Zimbra auth failed' }, { status: 500 })
  }
}
