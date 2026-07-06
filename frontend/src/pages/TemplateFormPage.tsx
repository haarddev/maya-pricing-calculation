import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import * as templatesApi from '../api/templates.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { PageLoader } from '../components/ui/Spinner';
import { showError, showSuccess } from '../utils/toast';
import type {
  FieldType,
  PricingMethod,
  TemplateField,
  TemplateStatus,
} from '../types/template.types';

const ALL_STATUSES: TemplateStatus[] = ['ACTIVE', 'DISABLED', 'DRAFT', 'EXPIRED'];
const ALL_METHODS: PricingMethod[] = [
  'PRICE_BY_DESTINATION',
  'PRICE_BY_HOURS',
  'PRICE_BY_ROUTE',
  'PRICE_BY_DISTANCE',
  'PRICE_BY_AREA',
];
const ALL_FIELD_TYPES: FieldType[] = ['TEXT', 'NUMBER', 'DROPDOWN', 'BOOLEAN', 'DATE', 'TIME'];

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED', 'DRAFT', 'EXPIRED']),
  pricingMethod: z.enum([
    'PRICE_BY_DESTINATION',
    'PRICE_BY_HOURS',
    'PRICE_BY_ROUTE',
    'PRICE_BY_DISTANCE',
    'PRICE_BY_AREA',
  ]),
});

const fieldSchema = z.object({
  fieldKey: z.string().min(1),
  labelEn: z.string().min(1),
  labelHe: z.string().min(1),
  fieldType: z.enum(['TEXT', 'NUMBER', 'DROPDOWN', 'BOOLEAN', 'DATE', 'TIME']),
  options: z.string().optional(),
  required: z.boolean(),
});

type TemplateForm = z.infer<typeof templateSchema>;
type FieldForm = z.infer<typeof fieldSchema>;

export function TemplateFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isHebrew = i18n.language.startsWith('he');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [showAddField, setShowAddField] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'DRAFT',
      pricingMethod: 'PRICE_BY_DISTANCE',
    },
  });

  const {
    register: registerField,
    handleSubmit: handleFieldSubmit,
    reset: resetField,
    watch: watchField,
    control: controlField,
    formState: { errors: fieldErrors },
  } = useForm<FieldForm>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      fieldKey: '',
      labelEn: '',
      labelHe: '',
      fieldType: 'TEXT',
      options: '',
      required: true,
    },
  });

  const selectedFieldType = watchField('fieldType');

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const template = await templatesApi.getTemplate(id!);
        reset({
          name: template.name,
          description: template.description,
          status: template.status,
          pricingMethod: template.pricingMethod,
        });
        setFields(template.fields ?? []);
      } catch {
        showError();
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id, reset, t]);

  const onSubmit = async (data: TemplateForm) => {
    setSaving(true);
    try {
      if (isEdit && id) {
        await templatesApi.updateTemplate(id, {
          name: data.name,
          description: data.description,
          status: data.status,
        });
        showSuccess('toast.templateUpdated');
        navigate('/templates');
      } else {
        const created = await templatesApi.createTemplate(data);
        showSuccess('toast.templateCreated');
        navigate(`/templates/${created.id}`);
      }
    } catch {
      showError();
    } finally {
      setSaving(false);
    }
  };

  const onAddField = async (data: FieldForm) => {
    if (!id) return;
    try {
      const field = await templatesApi.addTemplateField(id, {
        fieldKey: data.fieldKey,
        labelEn: data.labelEn,
        labelHe: data.labelHe,
        fieldType: data.fieldType,
        options: data.options
          ? data.options.split(',').map((o) => o.trim()).filter(Boolean)
          : undefined,
        required: data.required,
      });
      setFields((prev) => [...prev, field as TemplateField]);
      resetField();
      setShowAddField(false);
      showSuccess('toast.templateFieldAdded');
    } catch {
      showError();
    }
  };

  const onDeleteField = async (fieldId: string) => {
    if (!id) return;
    try {
      await templatesApi.deleteTemplateField(id, fieldId);
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
      showSuccess('toast.templateFieldDeleted');
    } catch {
      showError();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" onClick={() => navigate('/templates')} className="!px-0">
        <ArrowLeft className="h-4 w-4" />
        {t('templates.cancel')}
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {isEdit ? t('templates.edit') : t('templates.new')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? t('templates.fieldsTitle') : t('templates.create')}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            {...register('name')}
            label={t('templates.name')}
            error={errors.name?.message}
          />
          <Textarea
            {...register('description')}
            label={t('templates.description')}
            rows={3}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label={t('templates.status')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                options={ALL_STATUSES.map((status) => ({
                  value: status,
                  label: t(`status.${status}`),
                }))}
              />
            )}
          />
          {!isEdit ? (
            <Controller
              name="pricingMethod"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('templates.type')}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  options={ALL_METHODS.map((method) => ({
                    value: method,
                    label: t(`pricingMethod.${method}`),
                  }))}
                />
              )}
            />
          ) : (
            <Input
              label={t('templates.type')}
              value={t(`pricingMethod.${watch('pricingMethod')}`)}
              disabled
              readOnly
            />
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <Button type="submit" loading={saving} className="sm:flex-1">
              {t('templates.save')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/templates')}
              className="sm:flex-1"
            >
              {t('templates.cancel')}
            </Button>
          </div>
        </form>
      </Card>

      {isEdit && (
        <Card>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t('templates.fieldsTitle')}</h2>
            <Button variant="secondary" onClick={() => setShowAddField((v) => !v)}>
              <Plus className="h-4 w-4" />
              {t('templates.addField')}
            </Button>
          </div>

          {showAddField && (
            <form
              onSubmit={handleFieldSubmit(onAddField)}
              className="mb-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4 sm:p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  {...registerField('fieldKey')}
                  label={t('templates.fieldKey')}
                  error={fieldErrors.fieldKey?.message}
                />
                <Controller
                  name="fieldType"
                  control={controlField}
                  render={({ field }) => (
                    <Select
                      label={t('templates.fieldType')}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      options={ALL_FIELD_TYPES.map((type) => ({
                        value: type,
                        label: t(`fieldType.${type}`),
                      }))}
                    />
                  )}
                />
                <Input
                  {...registerField('labelEn')}
                  label={t('templates.labelEn')}
                  error={fieldErrors.labelEn?.message}
                />
                <Input
                  {...registerField('labelHe')}
                  label={t('templates.labelHe')}
                  error={fieldErrors.labelHe?.message}
                />
                {selectedFieldType === 'DROPDOWN' && (
                  <div className="sm:col-span-2">
                    <Input {...registerField('options')} label={t('templates.options')} />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    {...registerField('required')}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {t('templates.required')}
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="sm:w-auto">
                  {t('templates.addField')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAddField(false)}>
                  {t('templates.cancel')}
                </Button>
              </div>
            </form>
          )}

          {/* Mobile field cards */}
          <div className="space-y-3 lg:hidden">
            {fields.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">{t('templates.noResults')}</p>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="font-mono text-sm font-semibold text-slate-900">{field.fieldKey}</p>
                    <Button variant="danger" className="!px-2 !py-1.5" onClick={() => void onDeleteField(field.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">
                    {isHebrew ? field.labelHe : field.labelEn}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                      {t(`fieldType.${field.fieldType}`)}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                      {field.required ? t('common.yes') : t('common.no')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop fields table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-start">
                  <th className="pb-3 font-semibold text-slate-600">{t('templates.fieldKey')}</th>
                  <th className="pb-3 font-semibold text-slate-600">
                    {isHebrew ? t('templates.labelHe') : t('templates.labelEn')}
                  </th>
                  <th className="pb-3 font-semibold text-slate-600">{t('templates.fieldType')}</th>
                  <th className="pb-3 font-semibold text-slate-600">{t('templates.required')}</th>
                  <th className="pb-3 text-center font-semibold text-slate-600">{t('templates.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-mono text-slate-900">{field.fieldKey}</td>
                    <td className="py-3 text-slate-600">
                      {isHebrew ? field.labelHe : field.labelEn}
                    </td>
                    <td className="py-3 text-slate-600">{t(`fieldType.${field.fieldType}`)}</td>
                    <td className="py-3 text-slate-600">
                      {field.required ? t('common.yes') : t('common.no')}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => void onDeleteField(field.id)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      {t('templates.noResults')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
