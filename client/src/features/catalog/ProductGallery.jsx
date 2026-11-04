import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function ProductIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-16 w-16 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

export default function ProductGallery({ images = [], name }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleImages = images.slice(0, 5);
  const activeImage = visibleImages[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  return (
    <div>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-surface">
        {activeImage ? (
          <img
            src={activeImage}
            alt={name}
            loading={activeIndex === 0 ? 'eager' : 'lazy'}
            className="h-full w-full object-contain"
          />
        ) : (
          <ProductIcon />
        )}
      </div>
      {visibleImages.length > 0 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {visibleImages.map((image, index) => (
            <button
              type="button"
              key={image}
              className={`aspect-square overflow-hidden rounded-xl bg-surface ${index === activeIndex ? 'ring-2 ring-ink' : ''}`}
              aria-label={t('product.image', { n: index + 1, total: visibleImages.length })}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
