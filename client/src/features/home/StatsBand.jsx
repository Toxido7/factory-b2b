import { useTranslation } from 'react-i18next';
import CountUp from '../../components/motion/CountUp.jsx';
import { Stagger, StaggerItem } from '../../components/motion/Stagger.jsx';
import { useSiteContent } from '../content/useSiteContent.js';

const stats = [
  { value: 'home.statYears', fallback: 'home.stats.yearsValue', label: 'home.stats.years' },
  { value: 'home.statEmployees', fallback: 'home.stats.employeesValue', label: 'home.stats.employees' },
  { value: 'home.statCountries', fallback: 'home.stats.countriesValue', label: 'home.stats.countries' },
  { value: 'home.statUnits', fallback: 'home.stats.unitsValue', label: 'home.stats.units' },
];

export default function StatsBand() {
  const { t } = useTranslation();
  const { text } = useSiteContent();

  return (
    <section className="bg-ink py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-8 md:grid-cols-4">
        <Stagger className="col-span-2 grid grid-cols-2 gap-8 md:col-span-4 md:grid-cols-4">
          {stats.map(({ value, fallback, label }) => {
            const translatedValue = text(value, t(fallback));
            const match = translatedValue.match(/^(\d+)([+k]?)$/);
            return (
              <StaggerItem key={value} className="text-center">
                <p className="font-display text-4xl font-bold text-accent">
                  {match
                    ? <CountUp value={Number(match[1])} suffix={match[2]} />
                    : translatedValue}
                </p>
                <p className="mt-2 text-sm text-white/70">{t(label)}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
