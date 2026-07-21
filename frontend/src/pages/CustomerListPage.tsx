import { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ListPageLayout } from '../components/Layout/ListPageLayout';
import { Button } from '../components/ui/Button';
import { FilterBar } from '../components/ui/FilterBar';
import { MobileEntityCard } from '../components/ui/MobileEntityCard';
import { PageBadge } from '../components/ui/PageBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataView } from '../components/ui/ResponsiveDataView';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TableIconButton } from '../components/ui/TableIconButton';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useCustomers, useDeleteCustomer } from '../hooks/queries/customers';
import type { Customer, CustomerStatus } from '../types/customer.types';

const ALL_STATUSES: CustomerStatus[] = ['ACTIVE', 'DISABLED'];
const columnHelper = createColumnHelper<Customer>();

export function CustomerListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { data: customers = [], isLoading, isFetching } = useCustomers({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });
  const deleteCustomer = useDeleteCustomer();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => t('customers.name'),
        cell: (info) => (
          <div>
            <span className="font-medium text-slate-900">{info.getValue()}</span>
            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{info.row.original.id}</p>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: () => t('customers.status'),
        cell: (info) => (
          <StatusBadge
            label={t(`customers.statuses.${info.getValue()}`)}
            status={info.getValue() === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'}
          />
        ),
      }),
      columnHelper.accessor('catalogCount', {
        header: () => t('customers.catalogCount'),
        cell: (info) => <span className="text-slate-700">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => t('customers.actions'),
        meta: { align: 'center' as const },
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <TableIconButton
              icon={Eye}
              title={t('customers.view')}
              onClick={() => navigate(`/customers/${row.original.id}`)}
            />
            <TableIconButton
              icon={Pencil}
              title={t('customers.edit')}
              onClick={() => navigate(`/customers/${row.original.id}`)}
            />
            <TableIconButton
              icon={Trash2}
              title={t('customers.delete')}
              variant="danger"
              onClick={() => setDeleteTarget(row.original)}
            />
          </div>
        ),
      }),
    ],
    [navigate, t],
  );

  return (
    <ListPageLayout
      header={
        <PageHeader
          badge={<PageBadge icon={Users} label={t('customers.badge')} />}
          title={t('customers.title')}
          subtitle={t('customers.subtitle')}
          actions={
            <Button onClick={() => navigate('/customers/new')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              {t('customers.create')}
            </Button>
          }
        />
      }
      filters={
        <FilterBar columns={2}>
          <SearchInput
            label={t('customers.search')}
            value={search}
            onChange={setSearch}
            placeholder={t('customers.searchPlaceholder')}
          />
          <Select
            label={t('customers.status')}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | '')}
            options={[
              { value: '', label: t('customers.allStatuses') },
              ...ALL_STATUSES.map((s) => ({
                value: s,
                label: t(`customers.statuses.${s}`),
              })),
            ]}
          />
        </FilterBar>
      }
      isLoading={isLoading}
      isFetching={isFetching}
      deleteDialog={{
        open: Boolean(deleteTarget),
        title: t('customers.deleteTitle'),
        message: t('customers.deleteMessage', { name: deleteTarget?.name ?? '' }),
        confirmLabel: t('customers.delete'),
        cancelLabel: t('customers.cancel'),
        loading: deleteCustomer.isPending,
        onConfirm: () => {
          if (!deleteTarget) return;
          deleteCustomer.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        },
        onCancel: () => setDeleteTarget(null),
      }}
    >
      <ResponsiveDataView
        data={customers}
        columns={columns}
        emptyMessage={t('customers.empty')}
        minWidth="720px"
        getRowId={(row) => row.id}
        renderMobileCard={(customer) => (
          <MobileEntityCard
            key={customer.id}
            title={customer.name}
            subtitle={customer.id}
            badge={
              <StatusBadge
                label={t(`customers.statuses.${customer.status}`)}
                status={customer.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'}
              />
            }
            stats={[
              {
                label: t('customers.catalogCount'),
                value: customer.catalogCount,
              },
            ]}
            actions={
              <>
                <Button
                  variant="secondary"
                  className="flex-1 !py-2"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  {t('customers.view')}
                </Button>
                <Button
                  variant="danger"
                  className="!px-3"
                  onClick={() => setDeleteTarget(customer)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            }
          />
        )}
      />
    </ListPageLayout>
  );
}
