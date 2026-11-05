import { escapeHtml } from '../../utils/escapeHtml.js';
import { formatReference } from '../../utils/reference.js';

const CURRENCY = 'TND';
const money = (value) => `${value.toFixed(2)} ${CURRENCY}`;
const referenceOf = (request) => formatReference(request.number, request.createdAt);

const itemsText = (request) =>
  request.items
    .map(
      (i) =>
        `- ${i.productName} (${i.sku}) | qté ${i.quantity} | prix unitaire ${money(i.unitPrice)} | remise ${i.discountPercent.toFixed(2)}% | total ${money(i.lineTotal)}`,
    )
    .join('\n');

const itemsHtml = (request) =>
  `<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Produit</th><th>Réf.</th><th>Qté</th><th>Prix unitaire</th><th>Remise</th><th>Total</th></tr>
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
    subject: `Nouvelle demande ${ref}`,
    text: `Nouvelle demande ${ref}

Client : ${request.customerName}
E-mail : ${request.customerEmail}
Société : ${company}
Téléphone : ${phone}

Produits :
${itemsText(request)}

Total estimé : ${money(request.estimatedTotal)}
Notes : ${notes}`,
    html: `<h2>Nouvelle demande ${ref}</h2>
<p><b>Client :</b> ${escapeHtml(request.customerName)}<br>
<b>E-mail :</b> ${escapeHtml(request.customerEmail)}<br>
<b>Société :</b> ${escapeHtml(company)}<br>
<b>Téléphone :</b> ${escapeHtml(phone)}</p>
${itemsHtml(request)}
<p><b>Total estimé :</b> ${money(request.estimatedTotal)}</p>
<p><b>Notes :</b> ${escapeHtml(notes)}</p>`,
  };
};

export const customerRequestEmail = (request) => {
  const ref = referenceOf(request);

  return {
    subject: `Nous avons bien reçu votre demande ${ref}`,
    text: `Bonjour ${request.customerName},

Nous avons bien reçu votre demande ${ref}. Notre équipe va l'examiner et vous contactera par téléphone.

Produits :
${itemsText(request)}

Total estimé : ${money(request.estimatedTotal)}`,
    html: `<p>Bonjour ${escapeHtml(request.customerName)},</p>
<p>Nous avons bien reçu votre demande <b>${ref}</b>. Notre équipe va l'examiner et vous contactera par téléphone.</p>
${itemsHtml(request)}
<p><b>Total estimé :</b> ${money(request.estimatedTotal)}</p>`,
  };
};
