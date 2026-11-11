import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import Button from './Button.jsx';
import { buildSearchUrl } from '../lib/search.js';
import { EASE, DURATION } from '../lib/motion.js';

const MotionContent = motion(Dialog.Content);

export default function SearchDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    onOpenChange(false);
  }, [location.key, onOpenChange]);

  function handleSubmit(event) {
    event.preventDefault();
    const url = buildSearchUrl(value);
    if (!url) return;
    navigate(url);
    setValue('');
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <MotionContent
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION, ease: EASE }}
          className="fixed left-0 right-0 top-0 z-50 border-b border-accent/30 bg-ink p-6 shadow-xl motion-reduce:transition-none md:p-8"
        >
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="sr-only">{t('search.title')}</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="ml-auto rounded-full p-2 text-white focus-visible:outline-2 focus-visible:outline-accent"
                  aria-label={t('search.close')}
                >
                  <X aria-hidden="true" className="h-6 w-6" />
                </button>
              </Dialog.Close>
            </div>
            <form className="mt-2" onSubmit={handleSubmit}>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-accent" />
                <input
                  ref={inputRef}
                  type="search"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={t('search.placeholder')}
                  aria-label={t('search.title')}
                  className="min-h-16 w-full rounded-2xl border border-white/20 bg-white px-14 text-lg text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-white/60">{t('search.hint')}</p>
                <Button type="submit">{t('search.submit')}</Button>
              </div>
            </form>
          </div>
        </MotionContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
