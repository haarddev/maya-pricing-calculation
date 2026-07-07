import { BookOpen, Clock, Lock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { SectionCard } from '../ui/SectionCard';
import { Select } from '../ui/Select';
import { SettingRow } from '../ui/SettingRow';
import { Input } from '../ui/Input';

const JWT_OPTIONS = ['1h', '6h', '12h', '1d', '3d', '7d', '14d', '30d'];

type SecuritySettingsProps = {
  jwtExpiresIn: string;
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  allowOnlyActiveTemplates: boolean;
  saving: boolean;
  onJwtChange: (value: string) => void;
  onLoginAttemptLimitChange: (value: number) => void;
  onLockoutDurationChange: (value: number) => void;
  onAllowOnlyActiveTemplatesChange: (value: boolean) => void;
  onSave: () => void;
};

export function SecuritySettings({
  jwtExpiresIn,
  loginAttemptLimit,
  lockoutDurationMinutes,
  allowOnlyActiveTemplates,
  saving,
  onJwtChange,
  onLoginAttemptLimitChange,
  onLockoutDurationChange,
  onAllowOnlyActiveTemplatesChange,
  onSave,
}: SecuritySettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('settings.security.title')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('settings.security.subtitle')}</p>
          </div>
        </div>
      </div>

      <SectionCard title={t('settings.security.sections.auth')}>
        <div className="space-y-3">
          <SettingRow
            icon={Clock}
            title={t('settings.security.jwtExpiresIn')}
            hint={t('settings.security.jwtHint')}
          >
            <Select
              label=""
              hideLabel
              value={jwtExpiresIn}
              onChange={(e) => onJwtChange(e.target.value)}
              options={JWT_OPTIONS.map((value) => ({ value, label: value }))}
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard title={t('settings.security.sections.loginProtection')}>
        <div className="grid gap-3 lg:grid-cols-2">
          <SettingRow
            icon={Lock}
            title={t('settings.security.loginAttemptLimit')}
            hint={t('settings.security.loginAttemptHint')}
          >
            <Input
              label=""
              hideLabel
              type="number"
              min={1}
              max={20}
              value={loginAttemptLimit}
              onChange={(e) => onLoginAttemptLimitChange(Number(e.target.value))}
            />
          </SettingRow>
          <SettingRow
            icon={Shield}
            title={t('settings.security.lockoutDuration')}
            hint={t('settings.security.lockoutHint')}
          >
            <Input
              label=""
              hideLabel
              type="number"
              min={1}
              max={1440}
              value={lockoutDurationMinutes}
              onChange={(e) => onLockoutDurationChange(Number(e.target.value))}
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard title={t('settings.security.sections.catalogRules')}>
        <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-4 sm:p-5 transition hover:border-brand-200 hover:bg-brand-50/20">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/80">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {t('settings.security.allowOnlyActiveTemplates')}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                  {t('settings.security.allowOnlyActiveTemplatesHint')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowOnlyActiveTemplates}
                onChange={(e) => onAllowOnlyActiveTemplatesChange(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-brand-600 shadow-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </label>
      </SectionCard>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button onClick={onSave} loading={saving} className="w-full sm:w-auto">
          {t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
