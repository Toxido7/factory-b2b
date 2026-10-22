import * as statsService from './stats.service.js';

export const overview = async (req, res) => {
  const data = await statsService.getOverview(req.validated.query);
  res.json({ success: true, data });
};

export const requestsOverTime = async (req, res) => {
  const data = await statsService.getRequestsOverTime(req.validated.query);
  res.json({ success: true, data });
};

export const topProducts = async (req, res) => {
  const data = await statsService.getTopProducts(req.validated.query);
  res.json({ success: true, data });
};

export const topCustomers = async (req, res) => {
  const data = await statsService.getTopCustomers(req.validated.query);
  res.json({ success: true, data });
};
