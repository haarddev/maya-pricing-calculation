import type { TemplateStatus } from '../../types/template.types';

const statusStyles: Record<TemplateStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  DISABLED: 'bg-slate-100 text-slate-600 ring-slate-200',
  DRAFT: 'bg-amber-100 text-amber-800 ring-amber-200',
  EXPIRED: 'bg-red-100 text-red-800 ring-red-200',
};

type StatusBadgeProps = {
  label: string;
  status: TemplateStatus;
};

export function StatusBadge({ label, status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}
