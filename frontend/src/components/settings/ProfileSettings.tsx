import type { UseFormReturn } from 'react-hook-form';
import { KeyRound, Lock, Mail, ShieldCheck, User, UserCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { User as AuthUser } from '../../types/settings.types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SectionCard } from '../ui/SectionCard';
import { SettingRow } from '../ui/SettingRow';

type ProfileForm = {
  name: string;
  email: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileSettingsProps = {
  user: AuthUser;
  profileForm: UseFormReturn<ProfileForm>;
  passwordForm: UseFormReturn<PasswordForm>;
  savingProfile: boolean;
  savingPassword: boolean;
  onSaveProfile: (data: ProfileForm) => void;
  onSavePassword: (data: PasswordForm) => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProfileSettings({
  user,
  profileForm,
  passwordForm,
  savingProfile,
  savingPassword,
  onSaveProfile,
  onSavePassword,
}: ProfileSettingsProps) {
  const { t } = useTranslation();
  const watchedName = profileForm.watch('name');
  const watchedEmail = profileForm.watch('email');
  const displayName = watchedName.trim() || user.name;
  const displayEmail = watchedEmail.trim() || user.email;
  const role = user.role ?? 'USER';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('settings.profile.title')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('settings.profile.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionCard title={t('settings.profile.sections.account')}>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-3">
              <SettingRow
                icon={User}
                title={t('settings.profile.name')}
                hint={t('settings.profile.nameHint')}
              >
                <Input
                  {...profileForm.register('name')}
                  label=""
                  hideLabel
                  error={profileForm.formState.errors.name?.message}
                  placeholder={t('settings.profile.namePlaceholder')}
                />
              </SettingRow>

              <SettingRow
                icon={Mail}
                title={t('settings.profile.email')}
                hint={t('settings.profile.emailHint')}
              >
                <Input
                  {...profileForm.register('email')}
                  label=""
                  hideLabel
                  type="email"
                  error={profileForm.formState.errors.email?.message}
                  placeholder={t('settings.profile.emailPlaceholder')}
                />
              </SettingRow>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button type="submit" loading={savingProfile} className="w-full sm:w-auto">
                  {t('settings.save')}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title={t('settings.password.title')}>
            <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-4 sm:p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/80">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t('settings.password.subtitle')}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                      {t('settings.password.hint')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    {...passwordForm.register('currentPassword')}
                    label={t('settings.password.current')}
                    type="password"
                    error={passwordForm.formState.errors.currentPassword?.message}
                  />
                  <Input
                    {...passwordForm.register('newPassword')}
                    label={t('settings.password.new')}
                    type="password"
                    error={passwordForm.formState.errors.newPassword?.message}
                  />
                  <Input
                    {...passwordForm.register('confirmPassword')}
                    label={t('settings.password.confirm')}
                    type="password"
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button type="submit" loading={savingPassword} className="w-full sm:w-auto">
                  <Lock className="h-4 w-4" />
                  {t('settings.password.change')}
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>

        <SectionCard title={t('settings.profile.preview.title')} className="h-fit xl:sticky xl:top-24">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/30">
              {getInitials(displayName)}
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{displayName}</h3>
            <p className="mt-1 text-sm text-slate-500">{displayEmail}</p>
            <span
              className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                role === 'ADMIN'
                  ? 'bg-brand-100 text-brand-800 ring-brand-200'
                  : 'bg-slate-100 text-slate-700 ring-slate-200'
              }`}
            >
              {t(`settings.profile.roles.${role.toLowerCase()}`)}
            </span>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-start">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('settings.profile.preview.nameLabel')}
                </p>
                <p className="truncate text-sm font-medium text-slate-800">{displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-start">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('settings.profile.preview.emailLabel')}
                </p>
                <p className="truncate text-sm font-medium text-slate-800">{displayEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-start">
              <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('settings.profile.preview.roleLabel')}
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {t(`settings.profile.roles.${role.toLowerCase()}`)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
