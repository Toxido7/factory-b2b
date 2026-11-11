import { company } from '../../config/company.js';
import { useSiteContent } from './useSiteContent.js';

export default function useCompany() {
  const { text } = useSiteContent();

  return {
    name: company.name,
    phone: text('contact.phone', company.phone),
    whatsapp: text('contact.whatsapp', company.whatsapp),
    email: text('contact.email', company.email),
    address: text('contact.address', company.address),
    hours: text('contact.hours', company.hours),
    facebook: text('contact.facebook', ''),
    instagram: text('contact.instagram', ''),
  };
}
