import { useTranslation } from "react-i18next";

export default function Input({ label, error, id, ...props }) {
  const { t } = useTranslation();

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={`min-h-12 w-full rounded-xl border bg-surface px-4 outline-none focus:border-navy ${
          error ? "border-red-500" : "border-line"
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {t(error, { defaultValue: error })}
        </p>
      )}
    </div>
  );
}
