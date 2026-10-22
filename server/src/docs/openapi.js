// ---------- small helpers, so the paths below stay short ----------
const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });

const success = (description, data) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true }, data },
      },
    },
  },
});

const messageOnly = (description) =>
  success(description, { type: 'object', properties: { message: { type: 'string' } } });

const ref = (name) => ({ $ref: `#/components/responses/${name}` });
const bearer = [{ bearerAuth: [] }];

const str = (extra = {}) => ({ type: 'string', ...extra });
const passwordField = str({
  minLength: 8,
  maxLength: 72,
  description: '8 to 72 characters, at least one letter and one number',
});

const userWithToken = success('Success', {
  type: 'object',
  properties: {
    user: { $ref: '#/components/schemas/User' },
    accessToken: str({ description: 'Short-lived JWT (15 min). Send it as a Bearer token.' }),
  },
});

// ---------- the document ----------
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Factory B2B API',
    version: '1.0.0',
    description:
      'Catalog and order-request API for a factory.\n\n' +
      'Success: `{ success: true, data }`. Error: `{ success: false, error: { message, details } }`.\n\n' +
      'To try protected routes: log in, copy `accessToken`, click **Authorize**.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Auth', description: 'Accounts, sessions and passwords' }],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create a customer account',
        requestBody: jsonBody({
          type: 'object',
          required: ['email', 'password', 'fullName'],
          properties: {
            email: str({ format: 'email' }),
            password: passwordField,
            fullName: str(),
            companyName: str(),
            phone: str(),
          },
        }),
        responses: {
          201: success('Account created, verification email sent', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' } },
          }),
          400: ref('BadRequest'),
          409: ref('Conflict'),
          429: ref('TooManyRequests'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Returns the access token and sets the `refresh_token` httpOnly cookie.',
        requestBody: jsonBody({
          type: 'object',
          required: ['email', 'password'],
          properties: { email: str({ format: 'email' }), password: str() },
        }),
        responses: {
          200: userWithToken,
          400: ref('BadRequest'),
          401: ref('Unauthorized'),
          403: ref('Forbidden'),
          429: ref('TooManyRequests'),
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Get a new access token',
        description: 'Uses the refresh cookie. The cookie is rotated: the old one stops working.',
        security: [{ cookieAuth: [] }],
        responses: { 200: userWithToken, 401: ref('Unauthorized'), 429: ref('TooManyRequests') },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out this device',
        responses: { 200: messageOnly('Logged out (always 200)') },
      },
    },
    '/api/auth/logout-all': {
      post: {
        tags: ['Auth'],
        summary: 'Log out of all devices',
        security: bearer,
        responses: { 200: messageOnly('All sessions revoked'), 401: ref('Unauthorized') },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: bearer,
        responses: {
          200: success('The logged-in user', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' } },
          }),
          401: ref('Unauthorized'),
        },
      },
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify an email address',
        requestBody: jsonBody({
          type: 'object',
          required: ['token'],
          properties: { token: str() },
        }),
        responses: { 200: messageOnly('Email verified'), 400: ref('BadRequest') },
      },
    },
    '/api/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Send the verification email again',
        security: bearer,
        responses: {
          200: messageOnly('Email sent'),
          401: ref('Unauthorized'),
          429: ref('TooManyRequests'),
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Ask for a password reset link',
        description:
          'Always answers 200 with the same message, so nobody can test which emails exist.',
        requestBody: jsonBody({
          type: 'object',
          required: ['email'],
          properties: { email: str({ format: 'email' }) },
        }),
        responses: {
          200: messageOnly('Same message whether the account exists or not'),
          400: ref('BadRequest'),
          429: ref('TooManyRequests'),
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Set a new password with the emailed token',
        description: 'Revokes all sessions. The user must log in again.',
        requestBody: jsonBody({
          type: 'object',
          required: ['token', 'password'],
          properties: { token: str(), password: passwordField },
        }),
        responses: {
          200: messageOnly('Password updated'),
          400: ref('BadRequest'),
          429: ref('TooManyRequests'),
        },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password (logged in)',
        description:
          'Needs the current password. Wrong current password is 400, not 401. Revokes all sessions.',
        security: bearer,
        requestBody: jsonBody({
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: { currentPassword: str(), newPassword: passwordField },
        }),
        responses: {
          200: messageOnly('Password changed, please log in again'),
          400: ref('BadRequest'),
          401: ref('Unauthorized'),
          429: ref('TooManyRequests'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: str({ format: 'uuid' }),
          email: str({ format: 'email' }),
          fullName: str(),
          companyName: str({ nullable: true }),
          phone: str({ nullable: true }),
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          emailVerified: { type: 'boolean' },
          createdAt: str({ format: 'date-time' }),
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: str(),
              details: {
                type: 'object',
                description: 'Validation errors, keyed like `body.email`',
              },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Invalid input',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Unauthorized: {
        description: 'Missing, invalid or expired token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Not allowed (wrong role or disabled account)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Already exists, or not allowed in the current state',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      TooManyRequests: {
        description: 'Rate limit reached',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};
