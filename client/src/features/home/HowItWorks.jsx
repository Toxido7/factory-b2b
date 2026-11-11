import { useTranslation } from 'react-i18next';
import Reveal from '../../components/motion/Reveal.jsx';
import { Stagger, StaggerItem } from '../../components/motion/Stagger.jsx';

const steps = [
  ['1', 'home.how.s1Title', 'home.how.s1Text'],
  ['2', 'home.how.s2Title', 'home.how.s2Text'],
  ['3', 'home.how.s3Title', 'home.how.s3Text'],
];

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-8">
        <Reveal>
          <p className="text-sm font-bold tracking-[0.2em] text-ink">{t('home.how.eyebrow')}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink md:text-4xl">{t('home.how.title')}</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(([number, title, text]) => (
            <StaggerItem key={number}>
              <article className="lift rounded-3xl bg-white p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent font-bold text-ink">
                  {number}
                </span>
                <h3 className="mt-6 text-xl font-bold text-ink">{t(title)}</h3>
                <p className="mt-3 leading-7 text-muted">{t(text)}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
