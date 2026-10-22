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
const adminErrors = { 401: ref('Unauthorized'), 403: ref('Forbidden') };

const str = (extra = {}) => ({ type: 'string', ...extra });
const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const query = (name, schema, description) => ({ name, in: 'query', schema, description });

const passwordField = str({
  minLength: 8,
  maxLength: 72,
  description: '8 to 72 characters, at least one letter and one number',
});

const productBody = (required) => ({
  type: 'object',
  required,
  properties: {
    sku: str({ description: 'Saved in UPPERCASE' }),
    name: str(),
    description: str(),
    price: { type: 'number', description: 'Positive, max 2 decimals' },
    minQuantity: { type: 'integer', minimum: 1 },
    discountPercent: { type: 'number', minimum: 0, maximum: 100 },
    categoryId: str({ format: 'uuid' }),
    isActive: { type: 'boolean' },
  },
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
  tags: [
    { name: 'Auth', description: 'Accounts, sessions and passwords' },
    { name: 'Catalog', description: 'Public: browse categories and products' },
    { name: 'Admin catalog', description: 'Admin only: manage categories, products, images' },
  ],
  paths: {
    // ---------- Auth ----------
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

    // ---------- Catalog (public) ----------
    '/api/categories': {
      get: {
        tags: ['Catalog'],
        summary: 'List active categories',
        responses: {
          200: success('Active categories', {
            type: 'object',
            properties: {
              categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            },
          }),
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Catalog'],
        summary: 'Search and list products',
        description: 'Only active products in active categories. Sorted by `sort`.',
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }),
          query('limit', { type: 'integer', minimum: 1, maximum: 50, default: 12 }),
          query('q', { type: 'string' }, 'Searches name, sku and description'),
          query('category', { type: 'string' }, 'Category slug (includes its subcategories)'),
          query('minPrice', { type: 'number' }, 'On the base price'),
          query('maxPrice', { type: 'number' }, 'On the base price'),
          query('sort', {
            type: 'string',
            enum: ['newest', 'price_asc', 'price_desc', 'name'],
            default: 'newest',
          }),
        ],
        responses: {
          200: success('A page of products', {
            type: 'object',
            properties: {
              products: { type: 'array', items: { $ref: '#/components/schemas/PublicProduct' } },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          }),
          400: ref('BadRequest'),
        },
      },
    },
    '/api/products/{slug}': {
      get: {
        tags: ['Catalog'],
        summary: 'One product by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: success('The product', {
            type: 'object',
            properties: { product: { $ref: '#/components/schemas/PublicProduct' } },
          }),
          404: ref('NotFound'),
        },
      },
    },

    // ---------- Admin catalog ----------
    '/api/admin/categories': {
      get: {
        tags: ['Admin catalog'],
        summary: 'List all categories (including hidden)',
        security: bearer,
        responses: {
          200: success('All categories', {
            type: 'object',
            properties: {
              categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            },
          }),
          ...adminErrors,
        },
      },
      post: {
        tags: ['Admin catalog'],
        summary: 'Create a category',
        description:
          'The slug is made from the name once and never changes. One level of subcategories only.',
        security: bearer,
        requestBody: jsonBody({
          type: 'object',
          required: ['name'],
          properties: { name: str(), description: str(), parentId: str({ format: 'uuid' }) },
        }),
        responses: {
          201: success('Created', {
            type: 'object',
            properties: { category: { $ref: '#/components/schemas/Category' } },
          }),
          400: ref('BadRequest'),
          409: ref('Conflict'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/categories/{id}': {
      patch: {
        tags: ['Admin catalog'],
        summary: 'Edit or hide a category',
        description: 'There is no delete: hide it with `isActive: false`.',
        security: bearer,
        parameters: [idParam],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: str(),
            description: str(),
            parentId: str({ format: 'uuid', nullable: true }),
            isActive: { type: 'boolean' },
          },
        }),
        responses: {
          200: success('Updated', {
            type: 'object',
            properties: { category: { $ref: '#/components/schemas/Category' } },
          }),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          409: ref('Conflict'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/products': {
      get: {
        tags: ['Admin catalog'],
        summary: 'List all products (including hidden)',
        security: bearer,
        responses: {
          200: success('Products', {
            type: 'object',
            properties: {
              products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
            },
          }),
          ...adminErrors,
        },
      },
      post: {
        tags: ['Admin catalog'],
        summary: 'Create a product',
        security: bearer,
        requestBody: jsonBody(productBody(['sku', 'name', 'price', 'categoryId'])),
        responses: {
          201: success('Created', {
            type: 'object',
            properties: { product: { $ref: '#/components/schemas/Product' } },
          }),
          400: ref('BadRequest'),
          409: ref('Conflict'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/products/{id}': {
      get: {
        tags: ['Admin catalog'],
        summary: 'One product (admin view)',
        security: bearer,
        parameters: [idParam],
        responses: {
          200: success('The product', {
            type: 'object',
            properties: { product: { $ref: '#/components/schemas/Product' } },
          }),
          404: ref('NotFound'),
          ...adminErrors,
        },
      },
      patch: {
        tags: ['Admin catalog'],
        summary: 'Edit or hide a product',
        description: 'The slug does not change when the name changes. Hide with `isActive: false`.',
        security: bearer,
        parameters: [idParam],
        requestBody: jsonBody(productBody([])),
        responses: {
          200: success('Updated', {
            type: 'object',
            properties: { product: { $ref: '#/components/schemas/Product' } },
          }),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          409: ref('Conflict'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/products/{id}/images': {
      post: {
        tags: ['Admin catalog'],
        summary: 'Upload a product image',
        description:
          'jpeg, png or webp (checked by file content), max 5 MB, max 5 images per product.',
        security: bearer,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: { image: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          201: success('Image added', {
            type: 'object',
            properties: { product: { $ref: '#/components/schemas/Product' } },
          }),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/products/{id}/images/{filename}': {
      delete: {
        tags: ['Admin catalog'],
        summary: 'Remove a product image',
        security: bearer,
        parameters: [
          idParam,
          { name: 'filename', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: success('Image removed', {
            type: 'object',
            properties: { product: { $ref: '#/components/schemas/Product' } },
          }),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          ...adminErrors,
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
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: str({ format: 'uuid' }),
          name: str(),
          slug: str(),
          description: str({ nullable: true }),
          parentId: str({ format: 'uuid', nullable: true }),
          isActive: { type: 'boolean' },
        },
      },
      PublicProduct: {
        type: 'object',
        properties: {
          id: str({ format: 'uuid' }),
          sku: str(),
          name: str(),
          slug: str(),
          description: str({ nullable: true }),
          images: {
            type: 'array',
            items: str({ description: 'URL path like /uploads/<uuid>.png' }),
          },
          price: str({
            example: '100.00',
            description: 'Base unit price (a string, money is never a float)',
          }),
          minQuantity: { type: 'integer' },
          discountPercent: str({ example: '10' }),
          finalPrice: str({ example: '90.00', description: 'Price after discount, per unit' }),
          category: {
            type: 'object',
            properties: { name: str(), slug: str() },
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: str({ format: 'uuid' }),
          sku: str(),
          name: str(),
          slug: str(),
          description: str({ nullable: true }),
          images: { type: 'array', items: str() },
          price: str({ example: '100.00' }),
          minQuantity: { type: 'integer' },
          discountPercent: str({ example: '10' }),
          isActive: { type: 'boolean' },
          categoryId: str({ format: 'uuid' }),
          createdAt: str({ format: 'date-time' }),
          updatedAt: str({ format: 'date-time' }),
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
      NotFound: {
        description: 'Not found (or hidden)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      TooManyRequests: {
        description: 'Rate limit reached',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};
