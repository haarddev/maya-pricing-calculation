import type { ReactNode } from 'react';

type FilterBarProps = {
  children: ReactNode;
  columns?: 2 | 3;
};

const gridClass: Record<2 | 3, string> = {
  2: 'grid gap-4 lg:grid-cols-2',
  3: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
};

export function FilterBar({ children, columns = 3 }: FilterBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className={gridClass[columns]}>{children}</div>
    </div>
  );
}
