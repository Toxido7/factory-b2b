const number = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Tunis" });

// The API sends money as a string: "1250.00" -> "1 250,00 TND"
export const formatMoney = (value) => `${number.format(Number(value))} TND`;

// "2026-10-26T10:00:00Z" -> "26/10/2026"
export const formatDate = (value) => date.format(new Date(value));
