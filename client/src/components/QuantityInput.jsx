import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function QuantityInput({ value, min, max = 100000, onChange, label, id = 'quantity' }) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  function clamp(nextValue) {
    const parsed = Number.parseInt(nextValue, 10);
    if (Number.isNaN(parsed)) return min;
    return Math.min(max, Math.max(min, parsed));
  }

  function update(nextValue) {
    const next = clamp(nextValue);
    setInputValue(String(next));
    onChange(next);
  }

  function handleBlur() {
    update(inputValue);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="flex items-center rounded-full border border-line bg-surface">
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-full text-xl text-ink disabled:opacity-40"
          aria-label={t('product.decrease')}
          disabled={value <= min}
          onClick={() => update(value - 1)}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          aria-label={label}
          className="min-h-11 w-full bg-transparent text-center text-ink outline-none"
          value={inputValue}
          min={min}
          max={max}
          onChange={(event) => {
            setInputValue(event.target.value);
            if (event.target.value !== '') onChange(clamp(event.target.value));
          }}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-full text-xl text-ink disabled:opacity-40"
          aria-label={t('product.increase')}
          disabled={value >= max}
          onClick={() => update(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
