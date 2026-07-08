import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { SortableTableHeader } from './SortableTableHeader';

type DataTableProps<T> = {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  emptyMessage: string;
  minWidth?: string;
  getRowId?: (row: T) => string;
  expandedRowId?: string | null;
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => ReactNode;
  isRowExpanded?: (row: T) => boolean;
  defaultSorting?: SortingState;
  enableSorting?: boolean;
};

export function DataTable<T>({
  data,
  columns,
  emptyMessage,
  minWidth = '900px',
  getRowId,
  expandedRowId,
  onRowClick,
  renderExpandedRow,
  isRowExpanded,
  defaultSorting = [],
  enableSorting = true,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    enableSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  });

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <Card className="overflow-hidden !p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50/80 text-start">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                  <th
                    key={header.id}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : undefined
                    }
                    className={`px-5 py-3 font-semibold text-slate-600 ${
                      header.column.columnDef.meta?.align === 'center' ? 'text-center' : ''
                    }`}
                  >
                    {header.isPlaceholder ? null : (
                      <SortableTableHeader
                        header={header}
                        align={header.column.columnDef.meta?.align}
                      />
                    )}
                  </th>
                );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const expanded =
                isRowExpanded?.(row.original) ??
                (expandedRowId !== undefined && expandedRowId === row.id);

              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={`border-b border-slate-100 transition last:border-0 ${
                      onRowClick ? 'cursor-pointer hover:bg-slate-50/60' : 'hover:bg-slate-50/60'
                    } ${expanded ? 'bg-brand-50/40' : ''}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`px-5 py-4 align-top ${
                          cell.column.columnDef.meta?.align === 'center' ? 'text-center' : ''
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expanded && renderExpandedRow && (
                    <tr key={`${row.id}-expanded`} className="border-b border-slate-100 bg-slate-50/80">
                      <td colSpan={row.getVisibleCells().length} className="!p-0">
                        {renderExpandedRow(row.original)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
