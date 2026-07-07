import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="w-full">
      <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={textareaId}
        {...props}
        className={`w-full cursor-text resize-y rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed ${error ? 'border-red-300' : 'border-slate-200'} ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
