import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { getDocuments, downloadDocument } from '@/lib/supabase';

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

    // Prepare user-provided attachments
    const userAttachments = attachments && attachments.length > 0 ? attachments.map((file: { name: string; url: string }) => ({
      filename: file.name,
      path: file.url,
    })) : [];

    // Fetch and prepare additional documents from storage
    const additionalAttachments: any[] = [];
    try {
      const documentsResult = await getDocuments();
      if (documentsResult.success && documentsResult.data.length > 0) {
        for (const doc of documentsResult.data) {
          try {
            const downloadResult = await downloadDocument(doc.name);
            if (downloadResult.success && downloadResult.data) {
              // Convert blob to buffer for nodemailer
              const buffer = Buffer.from(await downloadResult.data.arrayBuffer());
              additionalAttachments.push({
                filename: doc.name,
                content: buffer,
                contentType: doc.metadata?.mimetype || 'application/octet-stream'
              });
            }
          } catch (docError) {
            console.warn(`Failed to attach document ${doc.name}:`, docError);
            // Continue with other documents even if one fails
          }
        }
      }
    } catch (docsError) {
      console.warn("Failed to fetch additional documents:", docsError);
      // Continue sending email even if additional documents fail
    }

    const mailOptions = {
      from: process.env.EMAIL || process.env.GOOGLE_EMAIL,
      to: recipient,
      subject: subject,
      text: message, // Plain text fallback
      html: createHtmlTemplate(subject, message), // HTML version with branding
      attachments: [...userAttachments, ...additionalAttachments],
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      message: 'Email sent successfully',
      additionalAttachmentsCount: additionalAttachments.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
