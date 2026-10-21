import { ApiError } from '../../utils/ApiError.js';
import { lineTotal, sum } from '../../utils/pricing.js';
import { formatReference } from '../../utils/reference.js';
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

  return toRequestResponse(created);
};
