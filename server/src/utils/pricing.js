import { Prisma } from '@prisma/client';

// price * (100 - discount) / 100, rounded to 2 decimals
export const finalUnitPrice = (price, discountPercent) =>
  new Prisma.Decimal(price)
    .mul(new Prisma.Decimal(100).minus(discountPercent))
    .div(100)
    .toDecimalPlaces(2);

export const lineTotal = (price, discountPercent, quantity) =>
  finalUnitPrice(price, discountPercent).mul(quantity);

export const sum = (decimals) =>
  decimals.reduce((total, value) => total.plus(value), new Prisma.Decimal(0));
