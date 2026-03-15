import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // or the API key the user mentioned
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"SJCET Booking System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
