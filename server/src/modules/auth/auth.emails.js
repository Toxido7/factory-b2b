import { escapeHtml } from '../../utils/escapeHtml.js';

export const verificationEmail = ({ fullName, url }) => ({
  subject: 'Confirmez votre adresse e-mail',
  text:
    `Bonjour ${fullName},\n\n` +
    `Merci pour votre inscription. Confirmez votre adresse e-mail en ouvrant ce lien :\n${url}\n\n` +
    `Le lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.`,
  html:
    `<p>Bonjour ${escapeHtml(fullName)},</p>` +
    `<p>Merci pour votre inscription. Confirmez votre adresse e-mail :</p>` +
    `<p><a href="${escapeHtml(url)}">Confirmer mon adresse e-mail</a></p>` +
    `<p>Le lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.</p>`,
});
export const passwordResetEmail = ({ fullName, url }) => ({
  subject: 'Réinitialisation de votre mot de passe',
  text:
    `Bonjour ${fullName},\n\n` +
    `Nous avons reçu une demande de réinitialisation de votre mot de passe. Ouvrez ce lien pour en choisir un nouveau :\n${url}\n\n` +
    `Le lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.`,
  html:
    `<p>Bonjour ${escapeHtml(fullName)},</p>` +
    `<p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>` +
    `<p><a href="${escapeHtml(url)}">Choisir un nouveau mot de passe</a></p>` +
    `<p>Le lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.</p>`,
});
