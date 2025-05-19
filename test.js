import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_PASSWORD
  }
});

const mailOptions = {
  from: process.env.EMAIL,
  to: 'lukamindjek@gmail.com',
  subject: 'Test Email from Node.js',
  text: 'Hello! This email was sent using Node.js and Gmail SMTP.'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
