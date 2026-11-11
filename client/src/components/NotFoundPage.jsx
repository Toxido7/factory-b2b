import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-8 py-24 text-center">
      <h1 className="font-display text-4xl font-bold text-ink">{t('notFoundPage.title')}</h1>
      <p className="mt-4 text-muted">{t('notFoundPage.text')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button as={Link} to="/">
          {t('notFoundPage.home')}
        </Button>
        <Button as={Link} to="/products" variant="ghost">
          {t('notFoundPage.products')}
        </Button>
      </div>
    </section>
  );
}
