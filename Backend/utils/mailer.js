const nodemailer = require('nodemailer');
require('dotenv').config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@yourapp.com';

let transporter = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('--- Mailer fallback (no SMTP configured) ---');
      console.log(mailOptions);
      return Promise.resolve({ accepted: [mailOptions.to] });
    },
  };
}

async function sendMail({ to, subject, html, text }) {
  const mailOptions = {
    from: MAIL_FROM,
    to,
    subject,
    html,
    text,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendMail,
};
