import { BookOpen, Clock, Lock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { SectionCard } from '../ui/SectionCard';
import { Select } from '../ui/Select';
import { SettingRow } from '../ui/SettingRow';
import { ToggleRow } from '../ui/ToggleSwitch';
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
        <SettingRow
          icon={BookOpen}
          title={t('settings.security.allowOnlyActiveTemplates')}
          hint={t('settings.security.allowOnlyActiveTemplatesHint')}
        >
          <ToggleRow
            checked={allowOnlyActiveTemplates}
            onChange={onAllowOnlyActiveTemplatesChange}
            label={allowOnlyActiveTemplates ? t('common.yes') : t('common.no')}
          />
        </SettingRow>
      </SectionCard>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button onClick={onSave} loading={saving} className="w-full sm:w-auto">
          {t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
