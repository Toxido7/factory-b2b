import pino from 'pino';
import { env } from './env.js';

const level = {
  development: 'debug',
  test: 'silent',
  production: 'info',
}[env.NODE_ENV];

export const logger = pino({
  level,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
      : undefined,
});
