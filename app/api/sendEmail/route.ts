import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { getDocuments, downloadDocument } from '@/lib/supabase';

// Function to create HTML email template with Magic Net branding
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        @media only screen and (max-width: 640px) {
          .email-container {
            width: 100% !important;
            margin: 0 !important;
          }
          .header-content {
            flex-direction: column !important;
            text-align: center !important;
            padding: 20px !important;
          }
          .logo-section {
            margin-top: 20px !important;
            text-align: center !important;
          }
          .nav-links {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .service-links {
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh;">
      
      <!-- Email Container -->
      <div style="max-width: 680px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);" class="email-container">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); position: relative; overflow: hidden;">
          <!-- Subtle pattern overlay -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%);"></div>
          
          <div style="position: relative; padding: 32px 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center;" class="header-content">
              
              <!-- Company Name -->
              <div>
                <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">Magic NET</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 400;">Optički internet bez granica</p>
              </div>
              
              <!-- Logo -->
              <div style="text-align: right;" class="logo-section">
                <img src="https://qfpjbgjxkpwtsegtkaze.supabase.co/storage/v1/object/public/images//logo.png" alt="Magic NET Logo" style="height: 48px; filter: brightness(1.1);" />
              </div>
            </div>
          </div>
        </div>
        <div style="padding: 48px 40px;">
          <div style="font-size: 16px; line-height: 1.7; color: #374151;">
            ${formattedMessage}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #1f2937; color: #d1d5db; padding: 32px 40px; text-align: center;">
          
          <!-- Company Info -->
          <div style="margin-bottom: 24px;">
            <h4 style="color: white; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.025em;">MAGIC NET d.o.o.</h4>
            <div style="display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; margin-bottom: 16px;">
              <div style="text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Sjedište</p>
                <p style="color: #d1d5db; font-size: 14px; margin: 0; font-weight: 400;">Koprivnička ulica 17C<br>42230 Ludbreg</p>
              </div>
              <div style="text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Poslovnica</p>
                <p style="color: #d1d5db; font-size: 14px; margin: 0; font-weight: 400;">Kratka 2<br>42000 Varaždin</p>
              </div>
            </div>
          </div>
          
          <!-- Contact Info -->
          <div style="margin-bottom: 24px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #60a5fa; font-size: 16px;">📧</span>
                <span style="color: white; font-weight: 500; font-size: 15px;">info@mtnet.hr</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #60a5fa; font-size: 16px;">🌐</span>
                <span style="color: white; font-weight: 500; font-size: 15px;">mtnet.hr</span>
              </div>
            </div>
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; font-weight: 400;">© ${new Date().getFullYear()} Magic Net d.o.o. Sva prava pridržana.</p>
          </div>
        </div>
        
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
