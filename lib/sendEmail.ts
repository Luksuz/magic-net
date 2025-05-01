"use server"

/**
 * Generates an HTML email template with responsive design
 */
function createHtmlTemplate(subject: string, message: string): string {
  // Convert line breaks to HTML paragraphs
  const formattedMessage = message
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => `<p style="margin-bottom: 16px; line-height: 1.5;">${line}</p>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="hr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        @media only screen and (max-width: 620px) {
          .email-container {
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px;" class="email-container">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #2563eb;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Magic Net</h1>
          </td>
        </tr>
        <tr>
          <td style="background-color: #ffffff; padding: 30px;">
            <h2 style="margin-top: 0; color: #2563eb; font-size: 20px;">${subject}</h2>
            <div style="font-size: 16px; line-height: 1.5;">
              ${formattedMessage}
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #666666; font-size: 14px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Magic Net. Sva prava pridržana.</p>
            <p style="margin: 8px 0 0;">Koprivnička 17C, 42230 Ludbreg | Tel: 042/420-420</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export const sendEmail = async (recipient: string, subject: string, message: string, attachments: File[]) => {
  try {
    if (!process.env.MAILGUN_ENDPOINT || !process.env.MAILGUN_DOMAIN || !process.env.MAILGUN_API_KEY) {
      throw new Error("Mailgun environment variables are not set")
    }

    // Create HTML version of the email
    const htmlContent = createHtmlTemplate(subject, message);

    // Prepare form data with both text and HTML versions
    const formData = new FormData();
    formData.append('from', `Magic Net <${process.env.MAILGUN_DOMAIN}>`);
    formData.append('to', recipient);
    formData.append('subject', subject);
    formData.append('text', message); // Plain text fallback
    formData.append('html', htmlContent); // HTML version
    
    // Add attachments
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        formData.append('attachment', file);
      });
    }

    const response = await fetch(process.env.MAILGUN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${process.env.MAILGUN_API_KEY}`)}`,
        // Let the browser set the Content-Type with boundary for multipart/form-data
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
  