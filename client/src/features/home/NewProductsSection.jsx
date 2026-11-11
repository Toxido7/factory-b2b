import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import QueryState from '../../components/QueryState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Reveal from '../../components/motion/Reveal.jsx';
import { Stagger, StaggerItem } from '../../components/motion/Stagger.jsx';
import ProductCard from '../catalog/ProductCard.jsx';
import { useNewProducts } from '../catalog/catalogApi.js';

export default function NewProductsSection() {
  const { t } = useTranslation();
  const query = useNewProducts();

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex items-end justify-between gap-6">
          <Reveal>
            <p className="text-sm font-bold tracking-[0.2em] text-ink">{t('catalog.newEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold text-ink md:text-4xl">{t('catalog.newTitle')}</h2>
          </Reveal>
          <Button as={Link} to="/products" variant="ghost">
            {t('catalog.viewCatalog')}
          </Button>
        </div>
        <div className="mt-10">
          <QueryState
            query={query}
            isEmpty={(products) => products.length === 0}
            skeleton={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-[460px]" />
                ))}
              </div>
            }
            empty={<EmptyState title={t('catalog.noProducts')} />}
          >
            {(products) => (
              <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} isNew />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </QueryState>
        </div>
      </div>
    </section>
  );
}
