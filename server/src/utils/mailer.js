import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter =
  env.NODE_ENV === 'test'
    ? nodemailer.createTransport({ jsonTransport: true }) // builds the email, sends nothing
    : nodemailer.createTransport({
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        secure: env.MAIL_SECURE,
        auth: env.MAIL_USER ? { user: env.MAIL_USER, pass: env.MAIL_PASS } : undefined,
      });

export const sendEmail = ({ to, subject, text, html }) =>
  transporter.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
