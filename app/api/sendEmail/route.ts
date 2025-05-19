import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

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

    const mailOptions = {
      from: process.env.EMAIL || process.env.GOOGLE_EMAIL,
      to: recipient,
      subject: subject,
      text: message,
      attachments: attachments && attachments.length > 0 ? attachments.map((file: { name: string; url: string }) => ({
        filename: file.name,
        path: file.url,
      })) : [],
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
