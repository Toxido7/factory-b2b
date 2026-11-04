import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';

export default function Drawer({ open, onOpenChange, title, children }) {
  const { t } = useTranslation();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto bg-white p-6 transition-transform duration-[250ms] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 motion-reduce:transition-none">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-2xl font-bold text-ink">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="rounded-full p-2 text-ink" aria-label={t('shop.close')}>
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
