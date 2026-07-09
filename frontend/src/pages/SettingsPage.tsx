import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { UserManagement } from '../components/settings/UserManagement';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { Card } from '../components/ui/Card';
import { PageBadge } from '../components/ui/PageBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { TabNav } from '../components/ui/TabNav';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/SettingsContext';
import { useChangePassword, useUpdateProfile } from '../hooks/queries/auth';
import { showError, showSuccess } from '../utils/toast';
import type { CurrencyCode } from '../utils/currency';

const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type SettingsTab = 'general' | 'profile' | 'security' | 'users' | 'sessions';

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { settings, loading: settingsLoading, updateAppSettings } = useAppSettings();
  const isAdmin = user?.role === 'ADMIN';

  const [tab, setTab] = useState<SettingsTab>('profile');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [appName, setAppName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('ILS');
  const [jwtExpiresIn, setJwtExpiresIn] = useState('7d');
  const [loginAttemptLimit, setLoginAttemptLimit] = useState(5);
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState(15);
  const [allowOnlyActiveTemplates, setAllowOnlyActiveTemplates] = useState(true);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!settings) return;
    setAppName(settings.appName);
    setCurrency(settings.currency);
    setJwtExpiresIn(settings.jwtExpiresIn);
    setLoginAttemptLimit(settings.loginAttemptLimit);
    setLockoutDurationMinutes(settings.lockoutDurationMinutes);
    setAllowOnlyActiveTemplates(settings.allowOnlyActiveTemplates);
  }, [settings]);

  useEffect(() => {
    if (!user) return;
    profileForm.reset({ name: user.name, email: user.email });
  }, [user, profileForm]);

  if (!user) return <PageLoader />;

  const adminSettingsReady = Boolean(settings);
  const showAdminLoader = settingsLoading && !adminSettingsReady;

  const tabs: { id: SettingsTab; label: string; adminOnly?: boolean }[] = [
    { id: 'profile', label: t('settings.tabs.profile') },
    { id: 'general', label: t('settings.tabs.general'), adminOnly: true },
    { id: 'security', label: t('settings.tabs.security'), adminOnly: true },
    { id: 'users', label: t('settings.tabs.users'), adminOnly: true },
    // { id: 'sessions', label: t('settings.tabs.sessions') },
  ];

  const saveGeneral = async () => {
    setSavingGeneral(true);
    try {
      await updateAppSettings({ appName, currency });
      showSuccess('settings.toast.generalSaved');
    } catch {
      showError();
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveSecurity = async () => {
    setSavingSecurity(true);
    try {
      await updateAppSettings({
        jwtExpiresIn,
        loginAttemptLimit,
        lockoutDurationMinutes,
        allowOnlyActiveTemplates,
      });
      showSuccess('settings.toast.securitySaved');
    } catch {
      showError();
    } finally {
      setSavingSecurity(false);
    }
  };

  const saveProfile = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync(data);
      await refreshUser();
      showSuccess('settings.toast.profileSaved');
    } catch {
      showError();
    }
  };

  const savePassword = async (data: PasswordForm) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      showSuccess('settings.toast.passwordSaved');
    } catch {
      // error toast handled in mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<PageBadge icon={Settings} label={t('settings.badge')} />}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <TabNav
        tabs={tabs.map((item) => ({
          id: item.id,
          label: item.label,
          hidden: item.adminOnly && !isAdmin,
        }))}
        activeId={tab}
        onChange={setTab}
      />

      {tab === 'general' && isAdmin && (
        showAdminLoader ? (
          <Card className="py-12 text-center">
            <PageLoader />
          </Card>
        ) : (
          <GeneralSettings
            appName={appName}
            currency={currency}
            saving={savingGeneral}
            onAppNameChange={setAppName}
            onCurrencyChange={setCurrency}
            onSave={() => void saveGeneral()}
          />
        )
      )}

      {tab === 'profile' && (
        <ProfileSettings
          user={user}
          profileForm={profileForm}
          passwordForm={passwordForm}
          savingProfile={updateProfile.isPending}
          savingPassword={changePassword.isPending}
          onSaveProfile={saveProfile}
          onSavePassword={savePassword}
        />
      )}

      {tab === 'security' && isAdmin && (
        showAdminLoader ? (
          <Card className="py-12 text-center">
            <PageLoader />
          </Card>
        ) : (
          <SecuritySettings
            jwtExpiresIn={jwtExpiresIn}
            loginAttemptLimit={loginAttemptLimit}
            lockoutDurationMinutes={lockoutDurationMinutes}
            allowOnlyActiveTemplates={allowOnlyActiveTemplates}
            saving={savingSecurity}
            onJwtChange={setJwtExpiresIn}
            onLoginAttemptLimitChange={setLoginAttemptLimit}
            onLockoutDurationChange={setLockoutDurationMinutes}
            onAllowOnlyActiveTemplatesChange={setAllowOnlyActiveTemplates}
            onSave={() => void saveSecurity()}
          />
        )
      )}

      {tab === 'users' && isAdmin && <UserManagement currentUserId={user.id} />}

      {tab === 'sessions' && (
        <SectionCard title={t('settings.sessions.title')}>
          <p className="text-sm text-slate-500">{t('settings.sessions.future')}</p>
        </SectionCard>
      )}
    </div>
  );
}
