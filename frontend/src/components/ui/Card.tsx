import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
