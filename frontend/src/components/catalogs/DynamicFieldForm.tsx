import type { TemplateField } from '../../types/template.types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

type DynamicFieldFormProps = {
  fields: TemplateField[];
  values: Record<string, string | number | boolean>;
  isHebrew: boolean;
  onChange: (fieldKey: string, value: string | number | boolean) => void;
  errors?: Record<string, string>;
};

export function DynamicFieldForm({
  fields,
  values,
  isHebrew,
  onChange,
  errors = {},
}: DynamicFieldFormProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const label = isHebrew ? field.labelHe : field.labelEn;
        const value = values[field.fieldKey] ?? '';
        const error = errors[field.fieldKey];

        if (field.fieldType === 'DROPDOWN') {
          const options = (field.options as string[] | null) ?? [];
          return (
            <Select
              key={field.id}
              label={label}
              value={String(value)}
              onChange={(e) => onChange(field.fieldKey, e.target.value)}
              error={error}
              options={[
                { value: '', label: '—' },
                ...options.map((opt) => ({ value: opt, label: opt })),
              ]}
            />
          );
        }

        if (field.fieldType === 'BOOLEAN') {
          return (
            <label
              key={field.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(field.fieldKey, e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {label}
            </label>
          );
        }

        const inputType =
          field.fieldType === 'NUMBER'
            ? 'number'
            : field.fieldType === 'DATE'
              ? 'date'
              : field.fieldType === 'TIME'
                ? 'time'
                : 'text';

        return (
          <Input
            key={field.id}
            label={label}
            type={inputType}
            value={String(value)}
            onChange={(e) =>
              onChange(
                field.fieldKey,
                field.fieldType === 'NUMBER' ? e.target.value : e.target.value,
              )
            }
            error={error}
            required={field.required}
          />
        );
      })}
    </div>
  );
}
