import { describe, it, expect } from 'vitest';
import { sendEmail } from '../src/utils/mailer.js';

describe('sendEmail', () => {
  it('builds an email without really sending it (test mode)', async () => {
    const info = await sendEmail({
      to: 'customer@example.com',
      subject: 'Welcome',
      text: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(info.messageId).toBeDefined();
  });

  it('puts the recipient and subject in the message', async () => {
    const info = await sendEmail({
      to: 'customer@example.com',
      subject: 'Verify your email',
      text: 'Click the link',
    });

    expect(info.message).toContain('customer@example.com');
    expect(info.message).toContain('Verify your email');
  });
});
