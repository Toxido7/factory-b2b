import { useTranslation } from 'react-i18next';

const statusClasses = {
  PENDING: 'bg-surface text-muted',
  CONTACTED: 'border border-ink bg-transparent text-ink',
  CONFIRMED: 'bg-ink text-white',
  REJECTED: 'border border-line bg-transparent text-muted',
  CANCELLED: 'border border-line bg-transparent text-muted',
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusClasses[status] ?? statusClasses.PENDING}`}>
      {t(`requestStatus.${status}`)}
    </span>
  );
}
