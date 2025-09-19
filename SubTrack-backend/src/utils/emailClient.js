// Utility to send transactional emails with graceful fallbacks
// File: SubTrack-backend/src/utils/emailClient.js

import process from 'process';

let transporterPromise = null;

const createTransporter = async () => {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    try {
      const nodemailerModule = await import('nodemailer');
      const nodemailer = nodemailerModule.default || nodemailerModule;

      if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            : undefined
        });
      }

      console.warn('[email] SMTP configuration missing. Falling back to JSON transport.');
      return nodemailer.createTransport({ jsonTransport: true });
    } catch (error) {
      console.warn('[email] Nodemailer unavailable. Emails will be logged instead.', error.message);
      return {
        sendMail: async (mailOptions) => {
          console.log('[email] Simulated send:', JSON.stringify(mailOptions, null, 2));
          return { messageId: 'simulated', response: 'Email logged to console' };
        }
      };
    }
  })();

  return transporterPromise;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = await createTransporter();
  const fromAddress = process.env.EMAIL_FROM || 'SubTrack <no-reply@subtrack.app>';

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(mailOptions);

  if (process.env.SMTP_HOST) {
    console.log(`[email] Message queued for ${to} with id ${info.messageId}`);
  }

  return info;
};

export default {
  sendEmail
};
