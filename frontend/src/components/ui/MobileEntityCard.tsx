import type { ReactNode } from 'react';
import { Card } from './Card';

type StatItem = {
  label: string;
  value: ReactNode;
};

type MobileEntityCardProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  stats: StatItem[];
  actions: ReactNode;
};

export function MobileEntityCard({
  title,
  subtitle,
  badge,
  stats,
  actions,
}: MobileEntityCardProps) {
  return (
    <Card className="transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {badge}
      </div>

      {stats.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
              <p className="mt-0.5 text-slate-700">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t border-slate-100 pt-3">{actions}</div>
    </Card>
  );
}
