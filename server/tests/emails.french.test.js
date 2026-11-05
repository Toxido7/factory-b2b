import { describe, expect, it } from 'vitest';
import { passwordResetEmail, verificationEmail } from '../src/modules/auth/auth.emails.js';
import {
  customerRequestEmail,
  teamRequestEmail,
} from '../src/modules/requests/requests.emails.js';

const moneyValue = (value) => ({ toFixed: () => value });
const request = {
  number: 42,
  createdAt: new Date('2026-11-05T00:00:00.000Z'),
  customerName: 'Sami',
  customerEmail: 'sami@example.com',
  customerCompany: 'EXQGA',
  customerPhone: '20123456',
  notes: 'Appeler le matin',
  estimatedTotal: moneyValue('100.00'),
  items: [
    {
      productName: 'Sac',
      sku: 'S-1',
      quantity: 2,
      unitPrice: moneyValue('50.00'),
      discountPercent: moneyValue('10.00'),
      lineTotal: moneyValue('90.00'),
    },
  ],
};

describe('French email templates', () => {
  it('builds the French verification email', () => {
    const mail = verificationEmail({
      fullName: 'Sami',
      url: 'http://localhost:5173/verify-email?token=abc123',
    });

    expect(mail.subject).toBe('Confirmez votre adresse e-mail');
    expect(mail.text).toContain('Merci pour votre inscription.');
    expect(mail.text).not.toContain('Confirm your email address');
    expect(mail.text).not.toContain('Please confirm your email address');
  });

  it('builds the French password reset email', () => {
    const mail = passwordResetEmail({
      fullName: 'Sami',
      url: 'http://localhost:5173/reset-password?token=abc123',
    });

    expect(mail.subject).toBe('Réinitialisation de votre mot de passe');
    expect(mail.text).toContain('Nous avons reçu une demande de réinitialisation');
    expect(mail.text).not.toContain('Reset your password');
    expect(mail.text).not.toContain('We received a request to reset your password');
  });

  it('builds the French team request email', () => {
    const mail = teamRequestEmail(request);

    expect(mail.subject).toContain('Nouvelle demande');
    expect(mail.text).toContain('Produits :');
    expect(mail.text).not.toContain('New order request');
    expect(mail.text).not.toContain('Items:');
  });

  it('builds the French customer confirmation email', () => {
    const mail = customerRequestEmail(request);

    expect(mail.subject).toContain('Nous avons bien reçu votre demande');
    expect(mail.text).toContain("Notre équipe va l'examiner et vous contactera par téléphone.");
    expect(mail.text).not.toContain('We received your request');
    expect(mail.text).not.toContain('Our team will review it and contact you.');
  });
});
