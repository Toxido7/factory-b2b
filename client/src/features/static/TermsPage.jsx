import { useTranslation } from 'react-i18next';
import LegalPage from './LegalPage.jsx';
import usePageTitle from '../../lib/usePageTitle.js';

export default function TermsPage() {
  const { t } = useTranslation();
  usePageTitle(t('legal.terms.title'));

  return (
    <LegalPage
      titleKey="legal.terms.title"
      sectionKeys={['legal.terms.s1', 'legal.terms.s2', 'legal.terms.s3', 'legal.terms.s4', 'legal.terms.s5', 'legal.terms.s6']}
    />
  );
}
