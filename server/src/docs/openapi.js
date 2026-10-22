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

const STATUSES = ['PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'];

// Fields shared by the order request schemas
const requestCore = {
  id: str({ format: 'uuid' }),
  reference: str({ example: 'REQ-2026-00042' }),
  status: { type: 'string', enum: STATUSES },
  estimatedTotal: str({ example: '1800.00', description: 'Money is a string with 2 decimals' }),
  createdAt: str({ format: 'date-time' }),
};
const customerFields = {
  customerName: str(),
  customerEmail: str({ format: 'email' }),
  customerCompany: str({ nullable: true }),
};

// Same date range for the 4 stats routes
const rangeParams = [
  query(
    'from',
    str({ format: 'date', example: '2026-03-01' }),
    'First day, YYYY-MM-DD. Default: 29 days before `to`',
  ),
  query(
    'to',
    str({ format: 'date', example: '2026-03-31' }),
    'Last day (included), YYYY-MM-DD. Default: today. Max range 366 days. Days are in UTC',
  ),
];
const rangeObject = {
  type: 'object',
  properties: { from: str({ format: 'date' }), to: str({ format: 'date' }) },
};

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

const oneAdminUser = (description) =>
  success(description, {
    type: 'object',
    properties: { user: { $ref: '#/components/schemas/AdminUser' } },
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
    { name: 'Order requests', description: 'Customer: send a request, see your history' },
    { name: 'Admin catalog', description: 'Admin only: manage categories, products, images' },
    { name: 'Admin requests', description: 'Admin only: see all requests, change status' },
    { name: 'Admin users', description: 'Admin only: customers and admin roles' },
    { name: 'Admin stats', description: 'Admin only: dashboard numbers' },
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

    // ---------- Order requests (customer) ----------
    '/api/requests': {
      post: {
        tags: ['Order requests'],
        summary: 'Send an order request',
        description:
          'Customers only (role USER) with a verified email. The server recalculates all prices ' +
          'from the database and ignores any price sent. Each quantity must reach the ' +
          "product's minimum.",
        security: bearer,
        requestBody: jsonBody({
          type: 'object',
          required: ['items'],
          properties: {
            notes: str(),
            items: {
              type: 'array',
              minItems: 1,
              maxItems: 50,
              items: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: str({ format: 'uuid' }),
                  quantity: { type: 'integer', minimum: 1, maximum: 100000 },
                },
              },
            },
          },
        }),
        responses: {
          201: success('Request saved, the team is emailed', {
            type: 'object',
            properties: { request: { $ref: '#/components/schemas/OrderRequest' } },
          }),
          400: ref('BadRequest'),
          401: ref('Unauthorized'),
          403: ref('Forbidden'),
          429: ref('TooManyRequests'),
        },
      },
    },
    '/api/requests/mine': {
      get: {
        tags: ['Order requests'],
        summary: 'My request history',
        security: bearer,
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }),
          query('limit', { type: 'integer', minimum: 1, maximum: 50, default: 10 }),
          query('status', { type: 'string', enum: STATUSES }),
        ],
        responses: {
          200: success('A page of my requests (no items, see the detail route)', {
            type: 'object',
            properties: {
              requests: { type: 'array', items: { $ref: '#/components/schemas/RequestSummary' } },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          }),
          400: ref('BadRequest'),
          401: ref('Unauthorized'),
          403: ref('Forbidden'),
        },
      },
    },
    '/api/requests/mine/{id}': {
      get: {
        tags: ['Order requests'],
        summary: 'One of my requests',
        description: "Someone else's request answers 404, not 403, so nothing is revealed.",
        security: bearer,
        parameters: [idParam],
        responses: {
          200: success('The request with its items', {
            type: 'object',
            properties: { request: { $ref: '#/components/schemas/OrderRequest' } },
          }),
          400: ref('BadRequest'),
          401: ref('Unauthorized'),
          403: ref('Forbidden'),
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

    // ---------- Admin requests ----------
    '/api/admin/requests': {
      get: {
        tags: ['Admin requests'],
        summary: 'List all order requests',
        security: bearer,
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }),
          query('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }),
          query('status', { type: 'string', enum: STATUSES }),
          query(
            'q',
            { type: 'string' },
            'A reference like REQ-2026-00042, or part of a customer name, email or company',
          ),
        ],
        responses: {
          200: success('A page of requests', {
            type: 'object',
            properties: {
              requests: {
                type: 'array',
                items: { $ref: '#/components/schemas/AdminRequestSummary' },
              },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          }),
          400: ref('BadRequest'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/requests/{id}': {
      get: {
        tags: ['Admin requests'],
        summary: 'One request with customer data and items',
        security: bearer,
        parameters: [idParam],
        responses: {
          200: success('The request', {
            type: 'object',
            properties: { request: { $ref: '#/components/schemas/AdminRequest' } },
          }),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/requests/{id}/status': {
      patch: {
        tags: ['Admin requests'],
        summary: 'Change the status of a request',
        description:
          'Allowed moves: PENDING to CONTACTED, CONFIRMED, REJECTED or CANCELLED. ' +
          'CONTACTED to CONFIRMED, REJECTED or CANCELLED. CONFIRMED to CANCELLED. ' +
          'REJECTED and CANCELLED are final. A forbidden move, or a request that another admin ' +
          'just changed, answers 409.',
        security: bearer,
        parameters: [idParam],
        requestBody: jsonBody({
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: STATUSES } },
        }),
        responses: {
          200: success('Updated', {
            type: 'object',
            properties: { request: { $ref: '#/components/schemas/AdminRequest' } },
          }),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          409: ref('Conflict'),
          ...adminErrors,
        },
      },
    },

    // ---------- Admin users ----------
    '/api/admin/users': {
      get: {
        tags: ['Admin users'],
        summary: 'List users',
        security: bearer,
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }),
          query('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }),
          query('q', { type: 'string' }, 'Searches name, email and company'),
          query('isActive', { type: 'string', enum: ['true', 'false'] }),
          query('role', { type: 'string', enum: ['USER', 'ADMIN'] }),
        ],
        responses: {
          200: success('A page of users', {
            type: 'object',
            properties: {
              users: { type: 'array', items: { $ref: '#/components/schemas/AdminUser' } },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          }),
          400: ref('BadRequest'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/users/{id}': {
      get: {
        tags: ['Admin users'],
        summary: 'One user with the number of requests',
        security: bearer,
        parameters: [idParam],
        responses: {
          200: oneAdminUser('The user'),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/users/{id}/status': {
      patch: {
        tags: ['Admin users'],
        summary: 'Disable or enable an account',
        description:
          'Disabling also revokes all refresh tokens. The access token still works for up to ' +
          '15 minutes. An admin cannot disable their own account (400). Same value twice is fine (200).',
        security: bearer,
        parameters: [idParam],
        requestBody: jsonBody({
          type: 'object',
          required: ['isActive'],
          properties: { isActive: { type: 'boolean' } },
        }),
        responses: {
          200: oneAdminUser('Updated'),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/users/{id}/role': {
      patch: {
        tags: ['Admin users'],
        summary: 'Promote to admin or demote to customer',
        description:
          'Revokes the refresh tokens of that user. Rules: not your own role (400), ' +
          'not a disabled account when promoting (409), never the last active admin (409).',
        security: bearer,
        parameters: [idParam],
        requestBody: jsonBody({
          type: 'object',
          required: ['role'],
          properties: { role: { type: 'string', enum: ['USER', 'ADMIN'] } },
        }),
        responses: {
          200: oneAdminUser('Updated'),
          400: ref('BadRequest'),
          404: ref('NotFound'),
          409: ref('Conflict'),
          ...adminErrors,
        },
      },
    },

    // ---------- Admin stats ----------
    '/api/admin/stats/overview': {
      get: {
        tags: ['Admin stats'],
        summary: 'Totals, status breakdown, conversion rate, new customers',
        description:
          'Conversion rate = CONFIRMED divided by all requests in the period, in percent with 1 decimal ' +
          '(0 when there are no requests). Recent periods look low because PENDING requests count.',
        security: bearer,
        parameters: rangeParams,
        responses: {
          200: success('The numbers', {
            type: 'object',
            properties: {
              range: rangeObject,
              totalRequests: { type: 'integer' },
              byStatus: {
                type: 'object',
                description: 'One key per status, 0 when empty',
                properties: Object.fromEntries(STATUSES.map((s) => [s, { type: 'integer' }])),
              },
              conversionRate: { type: 'number', example: 33.3 },
              newCustomers: {
                type: 'integer',
                description: 'Accounts with role USER created in the range',
              },
            },
          }),
          400: ref('BadRequest'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/stats/requests-over-time': {
      get: {
        tags: ['Admin stats'],
        summary: 'Number of requests per day or month',
        description: 'Empty periods are included with `count: 0`, so a chart has no gaps.',
        security: bearer,
        parameters: [
          ...rangeParams,
          query('interval', { type: 'string', enum: ['day', 'month'], default: 'day' }),
        ],
        responses: {
          200: success('One row per period', {
            type: 'object',
            properties: {
              range: rangeObject,
              interval: { type: 'string', enum: ['day', 'month'] },
              series: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    period: str({ example: '2026-03-01', description: 'YYYY-MM-DD or YYYY-MM' }),
                    count: { type: 'integer' },
                  },
                },
              },
            },
          }),
          400: ref('BadRequest'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/stats/top-products': {
      get: {
        tags: ['Admin stats'],
        summary: 'Most requested products',
        description: 'Sorted by total quantity. REJECTED and CANCELLED requests are ignored.',
        security: bearer,
        parameters: [
          ...rangeParams,
          query('limit', { type: 'integer', minimum: 1, maximum: 50, default: 5 }),
        ],
        responses: {
          200: success('The ranking', {
            type: 'object',
            properties: {
              range: rangeObject,
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productId: str({ format: 'uuid' }),
                    name: str(),
                    sku: str(),
                    quantity: { type: 'integer' },
                    estimatedValue: str({
                      example: '300.00',
                      description: 'Value of the requests, not sales (there is no payment)',
                    }),
                    requestCount: { type: 'integer' },
                  },
                },
              },
            },
          }),
          400: ref('BadRequest'),
          ...adminErrors,
        },
      },
    },
    '/api/admin/stats/top-customers': {
      get: {
        tags: ['Admin stats'],
        summary: 'Customers with the most requests',
        description: 'Sorted by number of requests. REJECTED and CANCELLED requests are ignored.',
        security: bearer,
        parameters: [
          ...rangeParams,
          query('limit', { type: 'integer', minimum: 1, maximum: 50, default: 5 }),
        ],
        responses: {
          200: success('The ranking', {
            type: 'object',
            properties: {
              range: rangeObject,
              customers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    userId: str({ format: 'uuid' }),
                    fullName: str(),
                    email: str({ format: 'email' }),
                    companyName: str({ nullable: true }),
                    requestCount: { type: 'integer' },
                    estimatedTotal: str({ example: '150.00' }),
                  },
                },
              },
            },
          }),
          400: ref('BadRequest'),
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
      AdminUser: {
        type: 'object',
        properties: {
          id: str({ format: 'uuid' }),
          email: str({ format: 'email' }),
          fullName: str(),
          companyName: str({ nullable: true }),
          phone: str({ nullable: true }),
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          isActive: { type: 'boolean' },
          emailVerified: { type: 'boolean' },
          requestCount: { type: 'integer' },
          createdAt: str({ format: 'date-time' }),
          updatedAt: str({ format: 'date-time' }),
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
      RequestItem: {
        type: 'object',
        description: 'A copy (snapshot) of the product as it was when the request was sent',
        properties: {
          productId: str({ format: 'uuid' }),
          productName: str(),
          sku: str(),
          unitPrice: str({ example: '100.00', description: 'Base price at that time' }),
          discountPercent: str({ example: '10' }),
          quantity: { type: 'integer' },
          lineTotal: str({ example: '180.00' }),
        },
      },
      OrderRequest: {
        type: 'object',
        properties: {
          ...requestCore,
          notes: str({ nullable: true }),
          items: { type: 'array', items: { $ref: '#/components/schemas/RequestItem' } },
        },
      },
      RequestSummary: {
        type: 'object',
        properties: { ...requestCore, itemCount: { type: 'integer' } },
      },
      AdminRequestSummary: {
        type: 'object',
        properties: { ...requestCore, ...customerFields, itemCount: { type: 'integer' } },
      },
      AdminRequest: {
        type: 'object',
        properties: {
          ...requestCore,
          ...customerFields,
          customerPhone: str({ nullable: true }),
          notes: str({ nullable: true }),
          emailSentAt: str({
            format: 'date-time',
            nullable: true,
            description: 'Empty when the team email failed (the retry script sends it again)',
          }),
          handledBy: {
            type: 'object',
            nullable: true,
            description: 'The admin who last changed the status',
            properties: { id: str({ format: 'uuid' }), fullName: str() },
          },
          updatedAt: str({ format: 'date-time' }),
          items: { type: 'array', items: { $ref: '#/components/schemas/RequestItem' } },
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
        description: 'Not allowed (wrong role, disabled account or unverified email)',
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
