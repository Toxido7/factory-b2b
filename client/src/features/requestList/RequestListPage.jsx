import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import QuantityInput from '../../components/QuantityInput.jsx';
import { formatMoney } from '../../lib/format.js';
import { translateServerMessage } from '../../lib/formErrors.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useRequestList } from './RequestListContext.jsx';
import { useCreateRequest } from './requestsApi.js';

function ProductPlaceholder() {
  return (
    <svg aria-hidden="true" className="h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

export default function RequestListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const createRequest = useCreateRequest();
  const {
    items,
    estimatedTotal,
    notes,
    setNotes,
    updateQuantity,
    removeItem,
    clear,
  } = useRequestList();
  const needsVerification = user?.role === 'USER' && user.emailVerified === false;
  const rawServerMessage = createRequest.error?.response?.data?.error?.message;
  const translatedServerMessage = rawServerMessage
    ? translateServerMessage(rawServerMessage)
    : null;

  usePageTitle(t('requestPage.title'));

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="requestPage.title" intro="requestPage.intro" />
        <EmptyState
          title={t('requestList.empty')}
          text={t('requestList.emptyHint')}
          action={
            <Button as={Link} to="/categories">
              {t('requestPage.browse')}
            </Button>
          }
        />
      </div>
    );
  }

  function sendRequest() {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (needsVerification || createRequest.isPending) return;

    createRequest.mutate(
      { items, notes },
      {
        onSuccess: (request) => {
          clear();
          navigate('/request-list/sent', {
            replace: true,
            state: { reference: request.reference },
          });
        },
      },
    );
  }

  return (
    <div>
      <PageHeader title="requestPage.title" intro="requestPage.intro" />
      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="space-y-6">
              {items.map((item) => {
                const discount = Math.round(Number(item.discountPercent));
                const lineTotal = Number(item.finalPrice) * item.quantity;

                return (
                  <article key={item.productId} className="rounded-3xl border border-line bg-white p-6">
                    <div className="flex flex-col gap-6 sm:flex-row">
                      <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <ProductPlaceholder />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={`/products/${item.slug}`} className="font-display text-xl font-bold text-ink hover:text-accent">
                          {item.name}
                        </Link>
                        <p className="mt-2 text-sm text-muted">{item.sku}</p>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{formatMoney(item.finalPrice)}</span>
                          {discount > 0 && (
                            <span className="text-sm text-muted line-through">{formatMoney(item.price)}</span>
                          )}
                          <span className="text-sm text-muted">{t('requestPage.unitPrice')}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
                        <p className="font-semibold text-ink">
                          {t('requestPage.lineTotal')}: {formatMoney(lineTotal)}
                        </p>
                        <QuantityInput
                          id={`request-page-quantity-${item.productId}`}
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
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-8">
              <label htmlFor="request-notes" className="mb-2 block text-sm font-medium text-ink">
                {t('requestPage.notesLabel')}
              </label>
              <textarea
                id="request-notes"
                className="min-h-32 w-full rounded-2xl border border-line bg-surface p-4 text-ink outline-none focus:border-ink"
                placeholder={t('requestPage.notesPlaceholder')}
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <p className="mt-2 text-right text-sm text-muted">{notes.length}/1000</p>
            </div>
          </div>
          <aside className="h-fit rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-8">
            <h2 className="font-display text-2xl font-bold text-ink">{t('requestPage.summary')}</h2>
            <p className="mt-5 flex justify-between text-muted">
              <span>{t('requestPage.itemsCount', { count: items.length })}</span>
              <span>{formatMoney(estimatedTotal)}</span>
            </p>
            <p className="mt-5 text-sm leading-6 text-muted">{t('requestList.estimateNote')}</p>
            {needsVerification && (
              <p className="mt-6 text-sm text-muted" role="status">
                {t('requestPage.verifyNeeded')}
              </p>
            )}
            {createRequest.isError && (
              <div className="mt-6 space-y-2 text-sm text-muted" role="alert">
                <p>{t('requestPage.sendError')}</p>
                {translatedServerMessage &&
                  translatedServerMessage !== rawServerMessage && (
                    <p>{translatedServerMessage}</p>
                  )}
              </div>
            )}
            <Button
              type="button"
              className="mt-6 w-full"
              onClick={sendRequest}
              disabled={needsVerification || createRequest.isPending}
            >
              {createRequest.isPending ? t('requestPage.sending') : t('requestPage.send')}
            </Button>
            {!user && <p className="mt-3 text-sm text-muted">{t('requestPage.loginHint')}</p>}
            <Button type="button" variant="ghost" className="mt-3 w-full" onClick={clear}>
              {t('requestPage.clear')}
            </Button>
          </aside>
        </div>
      </main>
    </div>
  );
}
