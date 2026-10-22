import { ApiError } from './ApiError.js';

export const DAY = 24 * 60 * 60 * 1000;
const MAX_DAYS = 366;

const startOfDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const toDayString = (date) => date.toISOString().slice(0, 10);

export const resolveRange = ({ from, to } = {}, now = new Date()) => {
  const last = to ? new Date(to) : startOfDay(now);
  const start = from ? new Date(from) : new Date(last.getTime() - 29 * DAY);

  if (start > last) throw ApiError.badRequest('"from" must be before "to"');
  const days = Math.round((last - start) / DAY) + 1;
  if (days > MAX_DAYS) throw ApiError.badRequest(`Date range is limited to ${MAX_DAYS} days`);

  return {
    start,
    end: new Date(last.getTime() + DAY),
    from: toDayString(start),
    to: toDayString(last),
    days,
  };
};
