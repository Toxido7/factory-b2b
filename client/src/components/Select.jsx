import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

const Select = forwardRef(function Select({ label, error, id, children, ...props }, ref) {
  const { t } = useTranslation();

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        className={`min-h-12 w-full rounded-xl border bg-surface px-4 outline-none focus:border-ink ${
          error ? 'border-red-500' : 'border-line'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {t(error, { defaultValue: error })}
        </p>
      )}
    </div>
  );
});

export default Select;
