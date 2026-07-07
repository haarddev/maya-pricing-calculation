import type { LucideIcon } from 'lucide-react';

type PageBadgeProps = {
  icon: LucideIcon;
  label: string;
};

export function PageBadge({ icon: Icon, label }: PageBadgeProps) {
  return (
    <div className="mb-2 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}
