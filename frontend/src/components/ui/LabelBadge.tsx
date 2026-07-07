import type { ReactNode } from 'react';

type LabelBadgeVariant = 'brand' | 'warning' | 'http';

type LabelBadgeProps = {
  children: ReactNode;
  variant: LabelBadgeVariant;
  statusCode?: number | null;
};

function httpStatusClass(code: number | null | undefined) {
  if (!code) return 'bg-slate-100 text-slate-700';
  if (code >= 500) return 'bg-red-100 text-red-800';
  if (code >= 400) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

const variantClass: Record<Exclude<LabelBadgeVariant, 'http'>, string> = {
  brand: 'bg-brand-50 text-brand-700',
  warning: 'bg-amber-50 text-amber-700',
};

export function LabelBadge({ children, variant, statusCode }: LabelBadgeProps) {
  const className =
    variant === 'http'
      ? httpStatusClass(statusCode)
      : variantClass[variant];

  return (
    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
