import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

// Function to create simple HTML email template
function createHtmlTemplate(subject: string, message: string): string {
  // Convert line breaks to HTML paragraphs
  const formattedMessage = message
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => `<p style="margin-bottom: 18px; line-height: 1.7; color: #374151; font-size: 16px;">${line}</p>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="hr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: #ffffff;
          color: #374151;
        }
        .email-content {
          max-width: 600px;
          margin: 0 auto;
          font-size: 16px;
          line-height: 1.7;
        }
      </style>
    </head>
    <body>
      <div class="email-content">
        ${formattedMessage}
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { recipient, subject, message, attachments } = await req.json();
    
    // Validate required fields
    if (!recipient || !recipient.trim()) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_PASSWORD,
      },
    });

    // Prepare attachments (now includes both user attachments and additional documents from frontend)
    const emailAttachments = attachments && attachments.length > 0 ? attachments.map((file: { name: string; url: string }) => ({
      filename: file.name,
      path: file.url,
    })) : [];

    const mailOptions = {
      from: process.env.EMAIL || process.env.GOOGLE_EMAIL,
      to: recipient,
      subject: subject,
      text: message, // Plain text fallback
      html: createHtmlTemplate(subject, message), // HTML version with branding
      attachments: emailAttachments,
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      message: 'Email sent successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
