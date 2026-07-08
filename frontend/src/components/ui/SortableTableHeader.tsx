import { flexRender, type Header } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SortableTableHeaderProps<T> = {
  header: Header<T, unknown>;
  align?: 'center' | 'start';
};

export function SortableTableHeader<T>({ header, align }: SortableTableHeaderProps<T>) {
  const { t } = useTranslation();
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const label = flexRender(header.column.columnDef.header, header.getContext());

  if (!canSort) {
    return <>{label}</>;
  }

  const sortTitle =
    sorted === 'asc'
      ? t('common.sortDesc')
      : sorted === 'desc'
        ? t('common.sortClear')
        : t('common.sortAsc');

  return (
    <button
      type="button"
      onClick={header.column.getToggleSortingHandler()}
      title={sortTitle}
      className={`inline-flex items-center gap-1.5 rounded-md transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        align === 'center' ? 'mx-auto' : ''
      } ${sorted ? 'text-slate-900' : ''}`}
    >
      <span>{label}</span>
      {sorted === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      )}
    </button>
  );
}
