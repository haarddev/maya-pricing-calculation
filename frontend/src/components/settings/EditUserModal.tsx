import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { LabelBadge } from '../ui/LabelBadge';
import type { ManagedUser } from '../../types/settings.types';

const editUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 6, {
      message: 'Password must be at least 6 characters',
    }),
  role: z.enum(['ADMIN', 'USER']),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

type EditUserForm = z.infer<typeof editUserSchema>;

type EditUserModalProps = {
  user: ManagedUser | null;
  isSelf: boolean;
  loading?: boolean;
  onClose: () => void;
  onSave: (data: EditUserForm) => void;
};

export function EditUserModal({ user, isSelf, loading, onClose, onSave }: EditUserModalProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role ?? 'USER',
      status: user.status ?? 'ACTIVE',
    });
  }, [user, reset]);

  const isLocked = Boolean(user?.lockedUntil && new Date(user.lockedUntil) > new Date());

  return (
    <Modal
      open={Boolean(user)}
      title={t('settings.users.editTitle')}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('templates.cancel')}
          </Button>
          <Button onClick={handleSubmit(onSave)} loading={loading}>
            {t('settings.save')}
          </Button>
        </div>
      }
    >
      {user && (
        <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
          {isSelf && (
            <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              {t('settings.users.editSelfHint')}
            </p>
          )}

          {isLocked && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <LabelBadge variant="warning">{t('settings.users.locked')}</LabelBadge>
              <span>{t('settings.users.unlockHint')}</span>
            </div>
          )}

          <Input
            {...register('name')}
            label={t('settings.profile.name')}
            error={errors.name?.message}
          />
          <Input
            {...register('email')}
            label={t('settings.profile.email')}
            type="email"
            error={errors.email?.message}
          />
          <Input
            {...register('password')}
            label={t('settings.users.newPassword')}
            type="password"
            placeholder={t('settings.users.passwordOptional')}
            error={errors.password?.message}
          />
          <p className="-mt-2 text-xs text-slate-500">{t('settings.users.passwordOptionalHint')}</p>

          <Select
            label={t('settings.users.role')}
            {...register('role')}
            options={[
              { value: 'USER', label: t('settings.users.roles.USER') },
              { value: 'ADMIN', label: t('settings.users.roles.ADMIN') },
            ]}
          />

          <Select
            label={t('settings.users.columns.status')}
            {...register('status')}
            disabled={isSelf}
            options={[
              { value: 'ACTIVE', label: t('settings.users.statuses.ACTIVE') },
              { value: 'DISABLED', label: t('settings.users.statuses.DISABLED') },
            ]}
          />
          {isSelf && (
            <p className="-mt-2 text-xs text-slate-500">{t('settings.users.statusSelfHint')}</p>
          )}
        </form>
      )}
    </Modal>
  );
}
