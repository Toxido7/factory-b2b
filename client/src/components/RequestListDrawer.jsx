import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';
import Drawer from './Drawer.jsx';
import QuantityInput from './QuantityInput.jsx';
import { formatMoney } from '../lib/format.js';
import { useRequestList } from '../features/requestList/RequestListContext.jsx';

export default function RequestListDrawer() {
  const { t } = useTranslation();
  const {
    items,
    estimatedTotal,
    isOpen,
    closeList,
    updateQuantity,
    removeItem,
  } = useRequestList();

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeList()} title={t('requestList.title')}>
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-display text-xl font-bold text-ink">{t('requestList.empty')}</p>
          <p className="mt-2 text-muted">{t('requestList.emptyHint')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {items.map((item) => (
              <article key={item.productId} className="border-b border-line pb-6">
                <div className="flex gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <svg aria-hidden="true" className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m4 7 8 4 8-4M12 11v10" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.slug}`} onClick={closeList} className="font-semibold text-ink hover:text-accent">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{item.sku}</p>
                    <p className="mt-2 text-sm text-muted">
                      {formatMoney(item.finalPrice)} · {formatMoney(Number(item.finalPrice) * item.quantity)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <QuantityInput
                    id={`request-quantity-${item.productId}`}
                    value={item.quantity}
                    min={item.minQuantity}
                    label={t('requestList.quantity')}
                    onChange={(quantity) => updateQuantity(item.productId, quantity)}
                  />
                  <button
                    type="button"
                    className="text-sm text-muted underline hover:text-accent"
                    onClick={() => removeItem(item.productId)}
                  >
                    {t('requestList.remove')}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <p className="flex items-center justify-between font-semibold text-ink">
              <span>{t('requestList.estimatedTotal')}</span>
              <span>{formatMoney(estimatedTotal)}</span>
            </p>
            <p className="mt-2 text-sm text-muted">{t('requestList.estimateNote')}</p>
            <Button as={Link} to="/request-list" className="mt-6 w-full" onClick={closeList}>
              {t('requestList.viewList')}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
