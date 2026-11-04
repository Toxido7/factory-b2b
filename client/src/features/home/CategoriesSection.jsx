import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import QueryState from '../../components/QueryState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import CategoryTile from '../catalog/CategoryTile.jsx';
import { useCategories } from '../catalog/catalogApi.js';

export default function CategoriesSection() {
  const { t } = useTranslation();
  const query = useCategories();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-ink">{t('catalog.eyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold text-ink md:text-4xl">
              {t('catalog.categoriesTitle')}
            </h2>
          </div>
          <Button as={Link} to="/products" variant="ghost">
            {t('catalog.seeAll')}
          </Button>
        </div>
        <div className="mt-10">
          <QueryState
            query={query}
            isEmpty={(categories) => categories.length === 0}
            skeleton={
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-40" />
                ))}
              </div>
            }
            empty={<EmptyState title={t('catalog.noCategories')} />}
          >
            {(categories) => (
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {categories.slice(0, 6).map((category, index) => (
                  <CategoryTile key={category.id} category={category} index={index} />
                ))}
              </div>
            )}
          </QueryState>
        </div>
      </div>
    </section>
  );
}
