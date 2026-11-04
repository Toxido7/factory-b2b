export const company = {
  name: 'EXQGA',
  phone: '[Numéro de téléphone]',
  whatsapp: '[Numéro WhatsApp]',
  email: '[Adresse e-mail]',
  address: '[Adresse]',
  hours: '[Horaires d\'ouverture]',
  social: [],
};

export function isReal(value) {
  return !value.startsWith('[');
}
