import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader.jsx';
import { isReal } from '../../config/company.js';
import useCompany from '../content/useCompany.js';
import usePageTitle from '../../lib/usePageTitle.js';

const contactItems = [
  ['address', 'contact.address', 'M4 5h16v14H4zM8 9h8M8 13h5'],
  ['phone', 'contact.phone', 'M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1-1 1.5-2.5 1.5C10 19 5 14 5 6c0-1.5.5-2.5 1.5-2.5Z'],
  ['whatsapp', 'contact.whatsapp', 'M6 18l1-3a7 7 0 1 1 3 2l-4 1Z'],
  ['email', 'contact.email', 'M4 6h16v12H4zM4 7l8 6 8-6'],
  ['hours', 'contact.hours', 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
];

function ContactIcon({ path }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d={path} />
    </svg>
  );
}

function ContactValue({ type, value }) {
  if (type === 'phone' && isReal(value)) return <a href={`tel:${value}`} className="hover:text-accent">{value}</a>;
  if (type === 'email' && isReal(value)) return <a href={`mailto:${value}`} className="hover:text-accent">{value}</a>;
  if (type === 'whatsapp' && isReal(value)) return <a href={`https://wa.me/${value}`} className="hover:text-accent">{value}</a>;
  return <span className="whitespace-pre-line">{value}</span>;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const company = useCompany();
  usePageTitle(t('contact.title'));

  return (
    <div>
      <PageHeader title="contact.title" intro="contact.intro" />
      <main className="mx-auto grid max-w-7xl gap-10 px-8 py-20 lg:grid-cols-2">
        <div className="space-y-4">
          {contactItems.map(([type, label, path]) => (
            <article key={type} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink text-accent">
                <ContactIcon path={path} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">{t(label)}</h2>
                <p className="mt-1 text-muted"><ContactValue type={type} value={company[type]} /></p>
              </div>
            </article>
          ))}
        </div>
        <div className="flex h-80 items-center justify-center rounded-3xl bg-surface text-muted">
          {t('contact.map')}
        </div>
      </main>
    </div>
  );
}
