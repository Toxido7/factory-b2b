import { useTranslation } from 'react-i18next';
import Skeleton from './Skeleton.jsx';

export default function PageFallback() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[32rem] p-6 lg:p-8" role="status">
      <span className="sr-only">{t('common.loading')}</span>
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <div className="mt-8 grid gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
