import { escapeHtml } from '../../utils/escapeHtml.js';

export const verificationEmail = ({ fullName, url }) => ({
  subject: 'Confirm your email address',
  text:
    `Hello ${fullName},\n\n` +
    `Please confirm your email address by opening this link:\n${url}\n\n` +
    `The link is valid for 24 hours. If you did not create an account, ignore this email.`,
  html:
    `<p>Hello ${escapeHtml(fullName)},</p>` +
    `<p>Please confirm your email address:</p>` +
    `<p><a href="${escapeHtml(url)}">Confirm my email</a></p>` +
    `<p>The link is valid for 24 hours. If you did not create an account, ignore this email.</p>`,
});
export const passwordResetEmail = ({ fullName, url }) => ({
  subject: 'Reset your password',
  text:
    `Hello ${fullName},\n\n` +
    `We received a request to reset your password. Open this link to choose a new one:\n${url}\n\n` +
    `The link is valid for 1 hour. If you did not ask for this, ignore this email: your password stays the same.`,
  html:
    `<p>Hello ${escapeHtml(fullName)},</p>` +
    `<p>We received a request to reset your password.</p>` +
    `<p><a href="${escapeHtml(url)}">Choose a new password</a></p>` +
    `<p>The link is valid for 1 hour. If you did not ask for this, ignore this email: your password stays the same.</p>`,
});
