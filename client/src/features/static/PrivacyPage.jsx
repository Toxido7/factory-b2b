import { useTranslation } from 'react-i18next';
import LegalPage from './LegalPage.jsx';
import usePageTitle from '../../lib/usePageTitle.js';

export default function PrivacyPage() {
  const { t } = useTranslation();
  usePageTitle(t('legal.privacy.title'));

  return (
    <LegalPage
      titleKey="legal.privacy.title"
      sectionKeys={['legal.privacy.s1', 'legal.privacy.s2', 'legal.privacy.s3', 'legal.privacy.s4', 'legal.privacy.s5']}
    />
  );
}
