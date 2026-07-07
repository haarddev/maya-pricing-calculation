import { useCallback, useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Crown,
  Lock,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EditUserModal } from './EditUserModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { LabelBadge } from '../ui/LabelBadge';
import { MobileEntityCard } from '../ui/MobileEntityCard';
import { ResponsiveDataView } from '../ui/ResponsiveDataView';
import { SectionCard } from '../ui/SectionCard';
import { TableIconButton } from '../ui/TableIconButton';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '../../hooks/queries/users';
import type { ManagedUser, UserRole } from '../../types/settings.types';

type UserManagementProps = {
  currentUserId: string;
};

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'USER']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
const columnHelper = createColumnHelper<ManagedUser>();

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function isLocked(user: ManagedUser) {
  return Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());
}

function UserAvatar({ name, role }: { name: string; role?: UserRole }) {
  const isAdmin = role === 'ADMIN';
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ring-white ${
        isAdmin
          ? 'bg-gradient-to-br from-indigo-500 to-brand-600 text-white'
          : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700'
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

function RoleBadge({ role, t }: { role?: UserRole; t: (key: string) => string }) {
  const value = role ?? 'USER';
  const isAdmin = value === 'ADMIN';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        isAdmin
          ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {isAdmin ? <Crown className="h-3 w-3" /> : <Users className="h-3 w-3" />}
      {t(`settings.users.roles.${value}`)}
    </span>
  );
}

function StatusBadge({ status, t }: { status?: ManagedUser['status']; t: (key: string) => string }) {
  const value = status ?? 'ACTIVE';
  const isActive = value === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {t(`settings.users.statuses.${value}`)}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: 'brand' | 'emerald' | 'indigo' | 'amber';
}) {
  const toneClass = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  }[tone];

  return (
    <Card className="!p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export function UserManagement({ currentUserId }: UserManagementProps) {
  const { t } = useTranslation();
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'USER' },
  });

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === 'ACTIVE').length,
      admins: users.filter((user) => user.role === 'ADMIN').length,
      locked: users.filter(isLocked).length,
    }),
    [users],
  );

  const onCreate = (data: CreateUserForm) => {
    createUser.mutate(data, { onSuccess: () => reset() });
  };

  const onEditSave = (data: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    status: 'ACTIVE' | 'DISABLED';
  }) => {
    if (!editTarget) return;

    const input: {
      name: string;
      email: string;
      role: UserRole;
      status: 'ACTIVE' | 'DISABLED';
      password?: string;
    } = {
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
    };

    if (data.password?.trim()) {
      input.password = data.password.trim();
    }

    updateUser.mutate(
      { id: editTarget.id, input },
      { onSuccess: () => setEditTarget(null) },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const renderUserCell = useCallback(
    (user: ManagedUser) => (
      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} role={user.role} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{user.name}</p>
            {user.id === currentUserId && (
              <LabelBadge variant="brand">{t('settings.users.you')}</LabelBadge>
            )}
            {isLocked(user) && (
              <LabelBadge variant="warning">
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {t('settings.users.locked')}
                </span>
              </LabelBadge>
            )}
          </div>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>
    ),
    [currentUserId, t],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => t('settings.users.columns.user'),
        cell: ({ row }) => renderUserCell(row.original),
      }),
      columnHelper.accessor('role', {
        header: () => t('settings.users.role'),
        cell: ({ row }) => <RoleBadge role={row.original.role} t={t} />,
      }),
      columnHelper.accessor('status', {
        header: () => t('settings.users.columns.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => t('settings.users.columns.actions'),
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const isSelf = row.original.id === currentUserId;
          return (
            <div className="flex items-center justify-center gap-1">
              <TableIconButton
                icon={Pencil}
                title={t('settings.users.edit')}
                onClick={() => setEditTarget(row.original)}
              />
              <TableIconButton
                icon={Trash2}
                title={t('settings.users.delete')}
                variant="danger"
                disabled={isSelf}
                onClick={() => setDeleteTarget(row.original)}
              />
            </div>
          );
        },
      }),
    ],
    [currentUserId, renderUserCell, t],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('settings.users.listTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('settings.users.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t('settings.users.stats.total')} value={stats.total} />
        <StatCard
          icon={Shield}
          label={t('settings.users.stats.active')}
          value={stats.active}
          tone="emerald"
        />
        <StatCard
          icon={Crown}
          label={t('settings.users.stats.admins')}
          value={stats.admins}
          tone="indigo"
        />
        <StatCard
          icon={Lock}
          label={t('settings.users.stats.locked')}
          value={stats.locked}
          tone="amber"
        />
      </div>

      <SectionCard
        title={t('settings.users.addTitle')}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <UserPlus className="h-3.5 w-3.5" />
            {t('settings.users.addHint')}
          </span>
        }
        className="border-brand-100/80 bg-gradient-to-br from-white to-brand-50/20"
      >
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2">
          <Input {...register('name')} label={t('settings.profile.name')} error={errors.name?.message} />
          <Input
            {...register('email')}
            label={t('settings.profile.email')}
            type="email"
            error={errors.email?.message}
          />
          <Input
            {...register('password')}
            label={t('settings.users.password')}
            type="password"
            error={errors.password?.message}
          />
          <Select
            label={t('settings.users.role')}
            {...register('role')}
            options={[
              { value: 'USER', label: t('settings.users.roles.USER') },
              { value: 'ADMIN', label: t('settings.users.roles.ADMIN') },
            ]}
          />
          <div className="md:col-span-2 flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" loading={createUser.isPending}>
              <UserPlus className="h-4 w-4" />
              {t('settings.users.add')}
            </Button>
          </div>
        </form>
      </SectionCard>

      {isLoading ? (
        <EmptyState message={t('common.loading')} />
      ) : (
        <ResponsiveDataView
          data={users}
          columns={columns}
          emptyMessage={t('settings.users.empty')}
          minWidth="900px"
          getRowId={(row) => row.id}
          renderMobileCard={(user) => (
            <MobileEntityCard
              key={user.id}
              title={user.name}
              subtitle={user.email}
              badge={
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={user.status} t={t} />
                  <RoleBadge role={user.role} t={t} />
                </div>
              }
              stats={[
                ...(user.id === currentUserId
                  ? [{ label: t('settings.users.role'), value: t('settings.users.you') }]
                  : []),
                ...(isLocked(user)
                  ? [{ label: t('settings.users.columns.status'), value: t('settings.users.locked') }]
                  : []),
              ]}
              actions={
                <>
                  <Button variant="secondary" className="flex-1" onClick={() => setEditTarget(user)}>
                    <Pencil className="h-4 w-4" />
                    {t('settings.users.edit')}
                  </Button>
                  <Button
                    variant="danger"
                    className="!px-3"
                    disabled={user.id === currentUserId}
                    onClick={() => setDeleteTarget(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              }
            />
          )}
        />
      )}

      <EditUserModal
        user={editTarget}
        isSelf={editTarget?.id === currentUserId}
        loading={updateUser.isPending}
        onClose={() => setEditTarget(null)}
        onSave={onEditSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('settings.users.deleteTitle')}
        message={t('settings.users.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('settings.users.delete')}
        cancelLabel={t('templates.cancel')}
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
