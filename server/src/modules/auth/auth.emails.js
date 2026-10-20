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
