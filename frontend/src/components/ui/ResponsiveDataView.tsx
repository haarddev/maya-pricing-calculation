import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { DataTable } from './DataTable';
import { EmptyState } from './EmptyState';

type ResponsiveDataViewProps<T> = {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  renderMobileCard: (item: T) => ReactNode;
  emptyMessage: string;
  minWidth?: string;
  getRowId?: (row: T) => string;
  expandedRowId?: string | null;
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => ReactNode;
};

export function ResponsiveDataView<T>({
  data,
  columns,
  renderMobileCard,
  emptyMessage,
  minWidth,
  getRowId,
  expandedRowId,
  onRowClick,
  renderExpandedRow,
}: ResponsiveDataViewProps<T>) {
  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <>
      <div className="space-y-4 lg:hidden">{data.map((item) => renderMobileCard(item))}</div>

      <div className="hidden lg:block">
        <DataTable
          data={data}
          columns={columns}
          emptyMessage={emptyMessage}
          minWidth={minWidth}
          getRowId={getRowId}
          expandedRowId={expandedRowId}
          onRowClick={onRowClick}
          renderExpandedRow={renderExpandedRow}
        />
      </div>
    </>
  );
}
