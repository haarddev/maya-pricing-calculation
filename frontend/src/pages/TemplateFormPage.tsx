import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { FormPageShell } from '../components/Layout/FormPageShell';
import { BackButton } from '../components/ui/BackButton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { FormActionFooter } from '../components/ui/FormActionFooter';
import { SectionCard } from '../components/ui/SectionCard';
import { TableIconButton } from '../components/ui/TableIconButton';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { PageLoader } from '../components/ui/Spinner';
import {
  useAddTemplateField,
  useCreateTemplate,
  useDeleteTemplateField,
  useTemplate,
  useUpdateTemplate,
} from '../hooks/queries/templates';
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
const fieldColumnHelper = createColumnHelper<TemplateField>();

export function TemplateFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isHebrew = i18n.language.startsWith('he');

  const [fields, setFields] = useState<TemplateField[]>([]);
  const [showAddField, setShowAddField] = useState(false);

  const { data: template, isLoading } = useTemplate(id);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate(id ?? '');
  const addField = useAddTemplateField(id ?? '');
  const deleteField = useDeleteTemplateField(id ?? '');

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
    if (!template) return;
    reset({
      name: template.name,
      description: template.description,
      status: template.status,
      pricingMethod: template.pricingMethod,
    });
    setFields(template.fields ?? []);
  }, [template, reset]);

  const onSubmit = (data: TemplateForm) => {
    if (isEdit && id) {
      updateTemplate.mutate(
        {
          name: data.name,
          description: data.description,
          status: data.status,
        },
        { onSuccess: () => navigate('/templates') },
      );
      return;
    }

    createTemplate.mutate(data, {
      onSuccess: (created) => navigate(`/templates/${created.id}`),
    });
  };

  const onAddField = (data: FieldForm) => {
    if (!id) return;
    addField.mutate(
      {
        fieldKey: data.fieldKey,
        labelEn: data.labelEn,
        labelHe: data.labelHe,
        fieldType: data.fieldType,
        options: data.options
          ? data.options.split(',').map((o) => o.trim()).filter(Boolean)
          : undefined,
        required: data.required,
      },
      {
        onSuccess: (field) => {
          setFields((prev) => [...prev, field as TemplateField]);
          resetField();
          setShowAddField(false);
        },
      },
    );
  };

  const onDeleteField = useCallback(
    (fieldId: string) => {
      if (!id) return;
      deleteField.mutate(fieldId, {
        onSuccess: () => setFields((prev) => prev.filter((f) => f.id !== fieldId)),
      });
    },
    [deleteField, id],
  );

  const fieldColumns = useMemo(
    () => [
      fieldColumnHelper.accessor('fieldKey', {
        header: () => t('templates.fieldKey'),
        cell: (info) => <span className="font-mono text-slate-900">{info.getValue()}</span>,
      }),
      fieldColumnHelper.display({
        id: 'label',
        header: () => (isHebrew ? t('templates.labelHe') : t('templates.labelEn')),
        cell: ({ row }) => (
          <span className="text-slate-600">
            {isHebrew ? row.original.labelHe : row.original.labelEn}
          </span>
        ),
      }),
      fieldColumnHelper.accessor('fieldType', {
        header: () => t('templates.fieldType'),
        cell: (info) => <span className="text-slate-600">{t(`fieldType.${info.getValue()}`)}</span>,
      }),
      fieldColumnHelper.accessor('required', {
        header: () => t('templates.required'),
        cell: (info) => (
          <span className="text-slate-600">{info.getValue() ? t('common.yes') : t('common.no')}</span>
        ),
      }),
      fieldColumnHelper.display({
        id: 'actions',
        header: () => t('templates.actions'),
        meta: { align: 'center' as const },
        cell: ({ row }) => (
          <TableIconButton
            icon={Trash2}
            title={t('templates.delete')}
            variant="danger"
            onClick={() => onDeleteField(row.original.id)}
          />
        ),
      }),
    ],
    [isHebrew, onDeleteField, t],
  );

  if (isEdit && isLoading) return <PageLoader />;

  return (
    <FormPageShell
      back={<BackButton to="/templates" label={t('templates.cancel')} />}
      title={isEdit ? t('templates.edit') : t('templates.new')}
      subtitle={isEdit ? t('templates.fieldsTitle') : t('templates.create')}
    >
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

          <div className="border-t border-slate-100 pt-5">
            <FormActionFooter
              saveLabel={t('templates.save')}
              cancelLabel={t('templates.cancel')}
              onCancel={() => navigate('/templates')}
              loading={createTemplate.isPending || updateTemplate.isPending}
            />
          </div>
        </form>
      </Card>

      {isEdit && (
        <SectionCard
          title={t('templates.fieldsTitle')}
          actions={
            <Button variant="secondary" onClick={() => setShowAddField((v) => !v)}>
              <Plus className="h-4 w-4" />
              {t('templates.addField')}
            </Button>
          }
        >

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
          <div className="hidden lg:block">
            <DataTable
              data={fields}
              columns={fieldColumns}
              emptyMessage={t('templates.noResults')}
              minWidth="700px"
              getRowId={(row) => row.id}
            />
          </div>
        </SectionCard>
      )}
    </FormPageShell>
  );
}
