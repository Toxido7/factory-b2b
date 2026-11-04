import { useTranslation } from 'react-i18next';

function PageIcon({ direction }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={direction === 'previous' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  let pages;
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  } else if (page <= 4) {
    pages = [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  } else if (page >= totalPages - 3) {
    pages = [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  } else {
    pages = [1, 'ellipsis-start', page - 1, page, page + 1, 'ellipsis-end', totalPages];
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label={t('shop.page', { page })}>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink disabled:opacity-40"
        aria-label={t('shop.prev')}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <PageIcon direction="previous" />
      </button>
      {pages.map((item) =>
        typeof item === 'string' ? (
          <span key={item} className="px-1 text-muted">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-full ${item === page ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink disabled:opacity-40"
        aria-label={t('shop.next')}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        <PageIcon direction="next" />
      </button>
    </nav>
  );
}
