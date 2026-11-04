import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';

export default function FiltersPanel({ filters, categories, onChange, onReset }) {
  const { t } = useTranslation();
  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);

  useEffect(() => {
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const applyPrices = () => onChange({ minPrice, maxPrice });
  const hasFilter = filters.category || filters.q || filters.minPrice || filters.maxPrice || filters.sort !== 'newest';

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold text-ink">{t('shop.category')}</p>
        <div className="space-y-1">
          <button
            type="button"
            className={`block w-full rounded-xl px-4 py-3 text-left ${!filters.category ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}
            onClick={() => onChange({ category: '' })}
          >
            {t('shop.all')}
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`block w-full rounded-xl px-4 py-3 text-left ${filters.category === category.slug ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}
              onClick={() => onChange({ category: category.slug })}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold text-ink">{t('shop.price')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Input id="filter-min-price" label={t('shop.min')} type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} onBlur={applyPrices} onKeyDown={(event) => event.key === 'Enter' && applyPrices()} />
          <Input id="filter-max-price" label={t('shop.max')} type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} onBlur={applyPrices} onKeyDown={(event) => event.key === 'Enter' && applyPrices()} />
        </div>
      </div>
      {hasFilter && (
        <Button type="button" variant="ghost" className="w-full" onClick={onReset}>
          {t('shop.reset')}
        </Button>
      )}
    </div>
  );
}
