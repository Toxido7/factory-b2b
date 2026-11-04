import { useTranslation } from 'react-i18next';

export default function EmptyState({ title, text, action }) {
  const { t } = useTranslation();

  return (
    <div className="py-16 text-center">
      <svg
        aria-hidden="true"
        className="mx-auto mb-4 h-12 w-12 text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7.5 5.25 4.5h13.5L21 7.5m-18 0h18m-18 0v10.125A2.375 2.375 0 0 0 5.375 20h13.25A2.375 2.375 0 0 0 21 17.625V7.5m-12 5.25h6"
        />
      </svg>
      <h2 className="text-xl font-semibold">{title ?? t('states.empty.title')}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
