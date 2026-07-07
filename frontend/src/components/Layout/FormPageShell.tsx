import type { ReactNode } from 'react';

type FormPageShellProps = {
  back?: ReactNode;
  topActions?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
};

export function FormPageShell({ back, topActions, title, subtitle, children }: FormPageShellProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {(back || topActions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {back}
          {topActions}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      {children}
    </div>
  );
}
