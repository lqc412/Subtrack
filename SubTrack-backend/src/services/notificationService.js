// Centralized transactional email helpers
// File: SubTrack-backend/src/services/notificationService.js

import { sendEmail } from '../utils/emailClient.js';

const appUrl = process.env.APP_URL || 'http://localhost:5173';

export const sendWelcomeEmail = async (user) => {
  if (!user?.email) {
    return;
  }

  const subject = 'Welcome to SubTrack – your subscription co-pilot';
  const html = `
    <h1>Welcome aboard, ${user.username || 'there'}!</h1>
    <p>Thanks for creating a SubTrack account. You're moments away from gaining complete visibility of your recurring costs.</p>
    <p>You can log in anytime at <a href="${appUrl}">${appUrl}</a>.</p>
    <p>Happy tracking!<br/>The SubTrack Team</p>
  `;

  const text = `Welcome aboard, ${user.username || 'there'}!

Thanks for creating a SubTrack account. You're moments away from gaining complete visibility of your recurring costs.

You can log in anytime at ${appUrl}.

Happy tracking!
The SubTrack Team`;

  await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

export const sendPasswordResetEmail = async (user, token) => {
  if (!user?.email || !token) {
    return;
  }

  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your SubTrack password';
  const html = `
    <h1>Password reset requested</h1>
    <p>Hello ${user.username || 'there'},</p>
    <p>We received a request to reset the password for your SubTrack account. You can set a new password by clicking the button below.</p>
    <p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background-color:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;">Choose a new password</a></p>
    <p>If you didn't request this change you can safely ignore this email. The link will expire in 1 hour.</p>
    <p>Stay secure,<br/>The SubTrack Team</p>
  `;

  const text = `Hello ${user.username || 'there'},

We received a request to reset the password for your SubTrack account. Use the link below to choose a new password:
${resetLink}

If you didn't request this change you can safely ignore this email. The link will expire in 1 hour.

Stay secure,
The SubTrack Team`;

  await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

export const sendPasswordChangedEmail = async (user) => {
  if (!user?.email) {
    return;
  }

  const subject = 'Your SubTrack password was changed';
  const html = `
    <h1>Password updated successfully</h1>
    <p>Hi ${user.username || 'there'},</p>
    <p>This is a confirmation that the password for your SubTrack account was changed.</p>
    <p>If you didn't perform this action, please reset your password immediately from the following link:</p>
    <p><a href="${appUrl}/forgot-password">Reset your password</a></p>
    <p>Keep tracking with confidence!<br/>The SubTrack Team</p>
  `;

  const text = `Hi ${user.username || 'there'},

This is a confirmation that the password for your SubTrack account was changed.

If you didn't perform this action, please reset your password immediately at ${appUrl}/forgot-password.

Keep tracking with confidence!
The SubTrack Team`;

  await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
