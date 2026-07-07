import { Switch } from './Switch';

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
};

export function ToggleSwitch({ checked, onChange, disabled, label, hint }: ToggleSwitchProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition ${
        disabled ? 'opacity-60' : 'hover:border-brand-200 hover:bg-brand-50/30'
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}

export function ToggleRow({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}
