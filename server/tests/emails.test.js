import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/escapeHtml.js';
import { verificationEmail } from '../src/modules/auth/auth.emails.js';

describe('escapeHtml', () => {
  it('turns HTML characters into harmless text', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });
});

describe('verificationEmail', () => {
  const url = 'http://localhost:5173/verify-email?token=abc123';

  it('includes the link in both the text and the html', () => {
    const mail = verificationEmail({ fullName: 'Sami', url });

    expect(mail.text).toContain(url);
    expect(mail.html).toContain(url);
  });

  it('escapes the name in the html', () => {
    const mail = verificationEmail({ fullName: '<b>Hacker</b>', url });

    expect(mail.html).not.toContain('<b>Hacker</b>');
    expect(mail.html).toContain('&lt;b&gt;Hacker&lt;/b&gt;');
  });
});
