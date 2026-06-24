import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${error ? 'border-red-300' : 'border-slate-200'} ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
