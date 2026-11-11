import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'rounded-3xl border-l-2 border-accent bg-ink text-white',
          title: 'text-white',
          description: 'text-white/70',
          closeButton: 'border-white/30 bg-transparent text-white',
        },
      }}
      closeButton
    />
  );
}
