import { company, isReal } from '../../../config/company.js';

const cleaned = (value) => (isReal(value) ? value : '');

export const GROUP_PATHS = {
  contact: '/contact',
  general: '/',
  home: '/',
  about: '/about',
  quality: '/quality',
};

export const CONTENT_FIELDS = [
  ['contact.phone', 'contact', 'phone', (t, values = company) => cleaned(values.phone)],
  ['contact.whatsapp', 'contact', 'whatsapp', (t, values = company) => cleaned(values.whatsapp)],
  ['contact.email', 'contact', 'email', (t, values = company) => cleaned(values.email)],
  ['contact.address', 'contact', 'address', (t, values = company) => cleaned(values.address)],
  ['contact.hours', 'contact', 'hours', (t, values = company) => cleaned(values.hours)],
  ['contact.facebook', 'contact', 'facebook', () => ''],
  ['contact.instagram', 'contact', 'instagram', () => ''],
  ['general.topbar', 'general', 'topbar', (t) => t('topbar.text')],
  ['general.tagline', 'general', 'tagline', (t) => t('footer.tagline')],
  ['general.taxNumber', 'general', 'taxNumber', () => ''],
  ['home.title', 'home', 'title', (t) => t('home.title')],
  ['home.text', 'home', 'text', (t) => t('home.text')],
  ['home.statYears', 'home', 'statYears', (t) => t('home.stats.yearsValue')],
  ['home.statEmployees', 'home', 'statEmployees', (t) => t('home.stats.employeesValue')],
  ['home.statCountries', 'home', 'statCountries', (t) => t('home.stats.countriesValue')],
  ['home.statUnits', 'home', 'statUnits', (t) => t('home.stats.unitsValue')],
  ['about.intro', 'about', 'intro', (t) => t('about.intro')],
  ['quality.intro', 'quality', 'intro', (t) => t('quality.intro')],
  ['quality.certName', 'quality', 'certName', (t) => t('quality.certName')],
  ['quality.certText', 'quality', 'certText', (t) => t('quality.certText')],
  ['quality.p1', 'quality', 'p1', (t) => t('quality.p1Text')],
  ['quality.p2', 'quality', 'p2', (t) => t('quality.p2Text')],
  ['quality.p3', 'quality', 'p3', (t) => t('quality.p3Text')],
].map(([key, group, name, getDefault]) => ({ key, group, name, getDefault }));

export const cleanDefault = (value) => (value.startsWith('[') ? '' : value);
