import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { useTranslation } from 'react-i18next';
import logo256 from '../assets/logo-256.webp';
import Button from './Button.jsx';

export default function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();

  useEffect(() => {
    if (import.meta.env.DEV) console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-8 py-16 text-center text-white">
      <img
        src={logo256}
        width={256}
        height={256}
        className="h-32 w-32 object-contain"
        alt={t('brand.name')}
      />
      <h1 className="mt-8 font-display text-4xl font-bold">{t('errorPage.title')}</h1>
      <p className="mt-4 max-w-xl text-white/70">{t('errorPage.text')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button type="button" onClick={() => window.location.reload()}>
          {t('errorPage.reload')}
        </Button>
        <Button as="a" href="/" variant="light">
          {t('errorPage.home')}
        </Button>
      </div>
    </main>
  );
}
