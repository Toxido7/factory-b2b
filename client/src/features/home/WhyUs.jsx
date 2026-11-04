import { useTranslation } from 'react-i18next';

const reasons = [
  ['home.why.w1Title', 'home.why.w1Text', 'M4 6h16M4 12h16M4 18h16'],
  ['home.why.w2Title', 'home.why.w2Text', 'M12 3v18m6-15H9.5a3.5 3.5 0 1 0 0 7H14.5a3.5 3.5 0 1 1 0 7H6'],
  ['home.why.w3Title', 'home.why.w3Text', 'm12 3 7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4Z'],
  ['home.why.w4Title', 'home.why.w4Text', 'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
];

export default function WhyUs() {
  const { t } = useTranslation();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-8">
        <p className="text-sm font-bold tracking-widest text-accent">{t('home.why.eyebrow')}</p>
        <h2 className="mt-3 text-3xl font-bold text-navy md:text-4xl">{t('home.why.title')}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(([title, text, path]) => (
            <article key={title}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                  <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                </svg>
              </span>
              <h3 className="mt-5 text-lg font-bold text-navy">{t(title)}</h3>
              <p className="mt-2 leading-7 text-muted">{t(text)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
