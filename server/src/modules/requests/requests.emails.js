import { escapeHtml } from '../../utils/escapeHtml.js';
import { formatReference } from '../../utils/reference.js';

const CURRENCY = 'TND';
const money = (value) => `${value.toFixed(2)} ${CURRENCY}`;
const referenceOf = (request) => formatReference(request.number, request.createdAt);

const itemsText = (request) =>
  request.items
    .map(
      (i) =>
        `- ${i.productName} (${i.sku}) | qty ${i.quantity} | unit ${money(i.unitPrice)} | discount ${i.discountPercent.toFixed(2)}% | line ${money(i.lineTotal)}`,
    )
    .join('\n');

const itemsHtml = (request) =>
  `<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Line</th></tr>
${request.items
  .map(
    (i) =>
      `<tr><td>${escapeHtml(i.productName)}</td><td>${escapeHtml(i.sku)}</td><td>${i.quantity}</td><td>${money(i.unitPrice)}</td><td>${i.discountPercent.toFixed(2)}%</td><td>${money(i.lineTotal)}</td></tr>`,
  )
  .join('\n')}
</table>`;

export const teamRequestEmail = (request) => {
  const ref = referenceOf(request);
  const company = request.customerCompany ?? '-';
  const phone = request.customerPhone ?? '-';
  const notes = request.notes ?? '-';

  return {
    subject: `New order request ${ref}`,
    text: `New order request ${ref}

Customer: ${request.customerName}
Email: ${request.customerEmail}
Company: ${company}
Phone: ${phone}

Items:
${itemsText(request)}

Estimated total: ${money(request.estimatedTotal)}
Notes: ${notes}`,
    html: `<h2>New order request ${ref}</h2>
<p><b>Customer:</b> ${escapeHtml(request.customerName)}<br>
<b>Email:</b> ${escapeHtml(request.customerEmail)}<br>
<b>Company:</b> ${escapeHtml(company)}<br>
<b>Phone:</b> ${escapeHtml(phone)}</p>
${itemsHtml(request)}
<p><b>Estimated total:</b> ${money(request.estimatedTotal)}</p>
<p><b>Notes:</b> ${escapeHtml(notes)}</p>`,
  };
};

export const customerRequestEmail = (request) => {
  const ref = referenceOf(request);

  return {
    subject: `We received your request ${ref}`,
    text: `Hello ${request.customerName},

We received your order request ${ref}. Our team will review it and contact you.

Items:
${itemsText(request)}

Estimated total: ${money(request.estimatedTotal)}`,
    html: `<p>Hello ${escapeHtml(request.customerName)},</p>
<p>We received your order request <b>${ref}</b>. Our team will review it and contact you.</p>
${itemsHtml(request)}
<p><b>Estimated total:</b> ${money(request.estimatedTotal)}</p>`,
  };
};
