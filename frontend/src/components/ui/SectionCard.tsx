import type { ReactNode } from 'react';
import { Card } from './Card';

type SectionCardProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, actions, children, className }: SectionCardProps) {
  return (
    <Card className={className}>
      <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${actions ? '' : ''}`}>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {actions}
      </div>
      {children}
    </Card>
  );
}
