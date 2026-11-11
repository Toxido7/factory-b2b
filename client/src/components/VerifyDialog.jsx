import * as Dialog from '@radix-ui/react-dialog';
import { MailWarning } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from './Button.jsx';
import { resendVerification } from '../features/auth/authApi.js';
import { DURATION, EASE } from '../lib/motion.js';

const MotionContent = motion(Dialog.Content);

export default function VerifyDialog({ open, onOpenChange, email }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await resendVerification();
      toast.success(t('verifyAlert.resent'));
    } catch (error) {
      console.error('Failed to resend verification email', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <MotionContent
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: DURATION, ease: EASE }}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink shadow-xl motion-reduce:transition-none md:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
              <MailWarning aria-hidden="true" className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="font-display text-2xl font-bold text-ink">
                {t('verifyAlert.title')}
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-base text-ink">
                {t('verifyAlert.body', { email })}
              </Dialog.Description>
            </div>
          </div>
          <ol className="mt-6 space-y-4 text-base">
            {['one', 'two', 'three'].map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-ink">
                  {index + 1}
                </span>
                <span className="pt-1">{t(`verifyAlert.steps.${step}`)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <Button type="button" onClick={resend} disabled={sending}>
              {t('verifyAlert.resend')}
            </Button>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                {t('verifyAlert.close')}
              </Button>
            </Dialog.Close>
          </div>
        </MotionContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
