import nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  bcc?: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendMail({ to, subject, text, html, bcc }: SendMailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    bcc,
    subject,
    text,
    html,
  });
}
