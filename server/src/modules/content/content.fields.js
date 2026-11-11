// The ONLY list of texts the owner can edit.
// To make another text editable later, add one line here.
export const CONTENT_FIELDS = [
  { key: 'contact.phone', group: 'contact', type: 'phone', maxLength: 30 },
  { key: 'contact.whatsapp', group: 'contact', type: 'phone', maxLength: 30 },
  { key: 'contact.email', group: 'contact', type: 'email', maxLength: 100 },
  { key: 'contact.address', group: 'contact', type: 'textarea', maxLength: 200 },
  { key: 'contact.hours', group: 'contact', type: 'textarea', maxLength: 300 },
  { key: 'contact.facebook', group: 'contact', type: 'url', maxLength: 200 },
  { key: 'contact.instagram', group: 'contact', type: 'url', maxLength: 200 },

  { key: 'general.topbar', group: 'general', type: 'text', maxLength: 200 },
  { key: 'general.tagline', group: 'general', type: 'text', maxLength: 150 },
  { key: 'general.taxNumber', group: 'general', type: 'text', maxLength: 50 },

  { key: 'home.title', group: 'home', type: 'text', maxLength: 80 },
  { key: 'home.text', group: 'home', type: 'textarea', maxLength: 400 },
  { key: 'home.statYears', group: 'home', type: 'text', maxLength: 10 },
  { key: 'home.statEmployees', group: 'home', type: 'text', maxLength: 10 },
  { key: 'home.statCountries', group: 'home', type: 'text', maxLength: 10 },
  { key: 'home.statUnits', group: 'home', type: 'text', maxLength: 10 },

  { key: 'about.intro', group: 'about', type: 'textarea', maxLength: 3000 },

  { key: 'quality.intro', group: 'quality', type: 'textarea', maxLength: 1500 },
  { key: 'quality.certName', group: 'quality', type: 'text', maxLength: 100 },
  { key: 'quality.certText', group: 'quality', type: 'textarea', maxLength: 300 },
  { key: 'quality.p1', group: 'quality', type: 'textarea', maxLength: 600 },
  { key: 'quality.p2', group: 'quality', type: 'textarea', maxLength: 600 },
  { key: 'quality.p3', group: 'quality', type: 'textarea', maxLength: 600 },
];

export const FIELD_BY_KEY = new Map(CONTENT_FIELDS.map((f) => [f.key, f]));

const PHONE_RE = /^[0-9+().\-\s]{5,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns an error message, or null if the value is fine.
// An empty value is always allowed: it means "back to the default text".
export function checkValue(field, value) {
  if (value.length > field.maxLength) {
    return `Must be at most ${field.maxLength} characters`;
  }
  if (value === '') return null;
  if (field.type === 'phone' && !PHONE_RE.test(value)) return 'Invalid phone number';
  if (field.type === 'email' && !EMAIL_RE.test(value)) return 'Invalid email address';
  if (field.type === 'url' && !/^https?:\/\/\S+$/i.test(value)) {
    return 'Must start with http:// or https://';
  }
  if (field.type !== 'textarea' && /[\r\n]/.test(value)) {
    return 'Must be on a single line';
  }
  return null;
}
