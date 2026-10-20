import { sendEmail } from '../src/utils/mailer.js';

const info = await sendEmail({
  to: 'customer@example.com',
  subject: 'Hello from the factory site',
  text: 'If you can read this, the mailer works.',
  html: '<h1>It works!</h1><p>If you can read this, the mailer works.</p>',
});

console.log('Email accepted, id:', info.messageId);
