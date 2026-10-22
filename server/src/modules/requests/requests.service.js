import { ApiError } from '../../utils/ApiError.js';
import { lineTotal, sum } from '../../utils/pricing.js';
import { formatReference } from '../../utils/reference.js';
import { env } from '../../config/env.js';
import { sendEmail } from '../../utils/mailer.js';
import { teamRequestEmail, customerRequestEmail } from './requests.emails.js';
import { logger } from '../../config/logger.js';
import { canTransition } from './requests.status.js';
import * as productsRepository from '../products/products.repository.js';
import * as usersRepository from '../users/users.repository.js';
import * as requestsRepository from './requests.repository.js';

const money = (decimal) => decimal.toFixed(2);

export const toRequestResponse = (request) => ({
  id: request.id,
  reference: formatReference(request.number, request.createdAt),
  status: request.status,
  notes: request.notes,
  estimatedTotal: money(request.estimatedTotal),
  createdAt: request.createdAt,
  items: request.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    unitPrice: money(item.unitPrice),
    discountPercent: money(item.discountPercent),
    quantity: item.quantity,
    lineTotal: money(item.lineTotal),
  })),
});

const isAvailable = (product) => product.isActive && product.category.isActive;
const notifyTeam = async (request) => {
  await sendEmail({ to: env.TEAM_EMAIL, ...teamRequestEmail(request) });
  await requestsRepository.markEmailSent(request.id);
};

// never throws: the request is already saved
const sendNotifications = async (request) => {
  try {
    await notifyTeam(request);
  } catch (err) {
    logger.error({ err, requestId: request.id }, 'Team email failed, will be retried');
  }
  try {
    await sendEmail({ to: request.customerEmail, ...customerRequestEmail(request) });
  } catch (err) {
    logger.error({ err, requestId: request.id }, 'Customer email failed');
  }
};

export const create = async (userId, { notes, items }) => {
  const user = await usersRepository.findById(userId);
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid or expired token');
  if (!user.emailVerified) {
    throw ApiError.forbidden('Please verify your email before sending a request');
  }

  const products = await productsRepository.findManyForRequest(items.map((i) => i.productId));
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines = items.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (!product || !isAvailable(product)) {
      throw ApiError.badRequest(`Product not available: ${productId}`);
    }
    if (quantity < product.minQuantity) {
      throw ApiError.badRequest(`Minimum quantity for ${product.name} is ${product.minQuantity}`);
    }
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice: product.price,
      discountPercent: product.discountPercent,
      quantity,
      lineTotal: lineTotal(product.price, product.discountPercent, quantity),
    };
  });

  const created = await requestsRepository.create({
    userId,
    notes,
    customerName: user.fullName,
    customerEmail: user.email,
    customerCompany: user.companyName,
    customerPhone: user.phone,
    estimatedTotal: sum(lines.map((line) => line.lineTotal)),
    items: { create: lines },
  });

  await sendNotifications(created);
  return toRequestResponse(created);
};
export const retryUnsentEmails = async ({ olderThanMinutes = 5, limit = 50 } = {}) => {
  const olderThan = new Date(Date.now() - olderThanMinutes * 60_000);
  const requests = await requestsRepository.findUnsent({ olderThan, limit });

  let sent = 0;
  for (const request of requests) {
    try {
      await notifyTeam(request);
      sent += 1;
    } catch (err) {
      logger.error({ err, requestId: request.id }, 'Retry of team email failed');
    }
  }
  return { found: requests.length, sent };
};
const toSummary = (request) => ({
  id: request.id,
  reference: formatReference(request.number, request.createdAt),
  status: request.status,
  estimatedTotal: money(request.estimatedTotal),
  itemCount: request._count.items,
  createdAt: request.createdAt,
});

export const listMine = async (userId, query) => {
  const { requests, total } = await requestsRepository.listByUser(userId, query);
  return {
    requests: requests.map(toSummary),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getMine = async (userId, id) => {
  const request = await requestsRepository.findOneByUser(id, userId);
  if (!request) throw ApiError.notFound('Request not found');
  return toRequestResponse(request);
};
const customerFields = (request) => ({
  customerName: request.customerName,
  customerEmail: request.customerEmail,
  customerCompany: request.customerCompany,
});

export const listAdmin = async (query) => {
  const { requests, total } = await requestsRepository.listAll(query);
  return {
    requests: requests.map((request) => ({ ...toSummary(request), ...customerFields(request) })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getAdmin = async (id) => {
  const request = await requestsRepository.findDetail(id);
  if (!request) throw ApiError.notFound('Request not found');
  return {
    ...toRequestResponse(request),
    ...customerFields(request),
    customerPhone: request.customerPhone,
    emailSentAt: request.emailSentAt,
    handledBy: request.handledBy,
    updatedAt: request.updatedAt,
  };
};

export const changeStatus = async (id, adminId, newStatus) => {
  const request = await requestsRepository.findDetail(id);
  if (!request) throw ApiError.notFound('Request not found');

  if (!canTransition(request.status, newStatus)) {
    throw ApiError.conflict(`Cannot change status from ${request.status} to ${newStatus}`);
  }

  const count = await requestsRepository.changeStatus(id, request.status, newStatus, adminId);
  if (count === 0) {
    throw ApiError.conflict('The request was changed by someone else, please reload');
  }

  return getAdmin(id);
};
