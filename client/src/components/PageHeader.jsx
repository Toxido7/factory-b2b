import { useTranslation } from 'react-i18next';

export default function PageHeader({ title, intro }) {
  const { t } = useTranslation();

  return (
    <header className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-8">
        <h1 className="font-display text-4xl font-bold text-ink">{t(title)}</h1>
        {intro && <p className="mt-4 max-w-2xl leading-7 text-muted">{t(intro)}</p>}
      </div>
    </header>
  );
}
