import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="w-full">
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={selectId}
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-300' : 'border-slate-200'} ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
