import * as Dialog from '@radix-ui/react-dialog';
import Button from './Button.jsx';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  text,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
  danger = false,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-xl">
          <Dialog.Title className="font-display text-2xl font-bold text-ink">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-muted">{text}</Dialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant={danger ? 'ghost' : 'accent'}
              onClick={onConfirm}
              disabled={loading}
              className={danger ? 'border-red-600 text-red-700 hover:bg-red-600 hover:text-white' : ''}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
