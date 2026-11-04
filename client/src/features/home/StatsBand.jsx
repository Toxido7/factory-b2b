import { useTranslation } from 'react-i18next';

const stats = [
  ['home.stats.yearsValue', 'home.stats.years'],
  ['home.stats.employeesValue', 'home.stats.employees'],
  ['home.stats.countriesValue', 'home.stats.countries'],
  ['home.stats.unitsValue', 'home.stats.units'],
];

export default function StatsBand() {
  const { t } = useTranslation();

  return (
    <section className="bg-navy py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-8 md:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={value} className="text-center">
            <p className="text-4xl font-bold text-accent">{t(value)}</p>
            <p className="mt-2 text-sm text-white/70">{t(label)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
