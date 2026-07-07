import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type SettingRowProps = {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children: ReactNode;
};

export function SettingRow({ icon: Icon, title, hint, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/80">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{title}</p>
          {hint && <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{hint}</p>}
        </div>
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:min-w-[220px]">{children}</div>
    </div>
  );
}
