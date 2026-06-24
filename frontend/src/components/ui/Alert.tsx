import type { ReactNode } from 'react';

type AlertProps = {
  variant?: 'error' | 'success' | 'info';
  children: ReactNode;
};

const styles = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-brand-200 bg-brand-50 text-brand-800',
};

export function Alert({ variant = 'error', children }: AlertProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`} role="alert">
      {children}
    </div>
  );
}
