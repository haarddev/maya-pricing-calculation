import { useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { DynamicFieldForm } from '../components/catalogs/DynamicFieldForm';
import { DownloadMenu } from '../components/catalogs/DownloadMenu';
import { FormPageShell } from '../components/Layout/FormPageShell';
import { BackButton } from '../components/ui/BackButton';
import { Card } from '../components/ui/Card';
import { FormActionFooter } from '../components/ui/FormActionFooter';
import { SectionCard } from '../components/ui/SectionCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { PageLoader } from '../components/ui/Spinner';
import {
  useCatalog,
  useCatalogTemplates,
  useCreateCatalog,
  useTemplateForCatalog,
  useUpdateCatalog,
} from '../hooks/queries/catalogs';
import { showError } from '../utils/toast';
import type { Catalog, FieldValues } from '../types/catalog.types';
import type { PricingMethod, Template, TemplateField } from '../types/template.types';
import { calculateCatalogPrice, formatPrice } from '../utils/catalogPricing';
import { downloadCatalog } from '../utils/catalogExport';

const ALL_STATUSES = ['ACTIVE', 'DISABLED', 'DRAFT'] as const;

const metaSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED', 'DRAFT']),
  templateId: z.string().min(1),
});

type MetaForm = z.infer<typeof metaSchema>;

export function CatalogFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isHebrew = i18n.language.startsWith('he');

  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedCatalog, setSavedCatalog] = useState<Catalog | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useCatalogTemplates();
  const { data: catalog, isLoading: catalogLoading } = useCatalog(id);
  const createCatalog = useCreateCatalog();
  const updateCatalog = useUpdateCatalog(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<MetaForm>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'DRAFT',
      templateId: '',
    },
  });

  const templateId = watch('templateId');
  const effectiveTemplateId = isEdit ? catalog?.templateId : templateId;

  const { data: templateDetail, isLoading: templateLoading } = useTemplateForCatalog(
    effectiveTemplateId,
    Boolean(effectiveTemplateId),
  );

  const selectedTemplate = useMemo(() => {
    if (isEdit && catalog?.template) return catalog.template as Template;
    return templateDetail ?? null;
  }, [catalog?.template, isEdit, templateDetail]);

  useEffect(() => {
    if (!catalog) return;
    reset({
      name: catalog.name,
      description: catalog.description,
      status: catalog.status,
      templateId: catalog.templateId,
    });
    setFieldValues(catalog.fieldValues);
    setSavedCatalog(catalog);
  }, [catalog, reset]);

  useEffect(() => {
    if (isEdit) return;
    setFieldValues({});
    setFieldErrors({});
  }, [templateId, isEdit]);

  const previewPrice = useMemo(() => {
    if (!selectedTemplate) return null;
    return calculateCatalogPrice(
      selectedTemplate.pricingMethod as PricingMethod,
      fieldValues,
    );
  }, [selectedTemplate, fieldValues]);

  const handleFieldChange = (fieldKey: string, value: string | number | boolean) => {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const validateFields = (fields: TemplateField[]) => {
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = fieldValues[field.fieldKey];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '');

      if (field.required && isEmpty) {
        nextErrors[field.fieldKey] = t('catalogs.fieldRequired');
      }
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (data: MetaForm) => {
    if (!selectedTemplate) {
      showError('catalogs.selectTemplateFirst');
      return;
    }

    if (!validateFields(selectedTemplate.fields ?? [])) {
      return;
    }

    if (isEdit && id) {
      updateCatalog.mutate(
        {
          name: data.name,
          description: data.description,
          status: data.status,
          fieldValues,
        },
        { onSuccess: () => navigate('/catalogs') },
      );
      return;
    }

    createCatalog.mutate(
      {
        name: data.name,
        description: data.description,
        status: data.status,
        templateId: data.templateId,
        fieldValues,
      },
      { onSuccess: () => navigate('/catalogs') },
    );
  };

  const loading =
    templatesLoading ||
    (isEdit && catalogLoading) ||
    (Boolean(effectiveTemplateId) && templateLoading && !selectedTemplate);

  if (loading) return <PageLoader />;

  const catalogForDownload: Catalog | null =
    savedCatalog && selectedTemplate
      ? {
          ...savedCatalog,
          name: watch('name'),
          description: watch('description') ?? '',
          status: watch('status'),
          fieldValues,
          calculatedPrice: previewPrice,
          template: selectedTemplate,
        }
      : null;

  return (
    <FormPageShell
      back={<BackButton to="/catalogs" label={t('catalogs.cancel')} />}
      topActions={
        isEdit && catalogForDownload ? (
          <DownloadMenu
            label={t('catalogs.download')}
            csvLabel={t('catalogs.downloadCsv')}
            jsonLabel={t('catalogs.downloadJson')}
            onDownload={(format) => downloadCatalog(catalogForDownload, format, t)}
          />
        ) : undefined
      }
      title={isEdit ? t('catalogs.edit') : t('catalogs.new')}
      subtitle={t('catalogs.formSubtitle')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard title={t('catalogs.basicInfo')}>
          <div className="space-y-4">
            <Input {...register('name')} label={t('catalogs.name')} error={errors.name?.message} />
            <Textarea {...register('description')} label={t('catalogs.description')} rows={3} />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('catalogs.status')}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  options={ALL_STATUSES.map((status) => ({
                    value: status,
                    label: t(`catalogStatus.${status}`),
                  }))}
                />
              )}
            />
            {!isEdit ? (
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('catalogs.selectTemplate')}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    error={errors.templateId?.message}
                    options={[
                      { value: '', label: t('catalogs.chooseTemplate') },
                      ...templates.map((template) => ({
                        value: template.id,
                        label: `${template.name} — ${t(`pricingMethod.${template.pricingMethod as PricingMethod}`)}`,
                      })),
                    ]}
                  />
                )}
              />
            ) : (
              <Input
                label={t('catalogs.template')}
                value={selectedTemplate?.name ?? ''}
                disabled
                readOnly
              />
            )}
          </div>
        </SectionCard>

        {selectedTemplate && (
          <>
            <SectionCard
              title={t('catalogs.fieldValues')}
              actions={
                <p className="text-sm text-slate-500">
                  {t(`pricingMethod.${selectedTemplate.pricingMethod as PricingMethod}`)}
                </p>
              }
            >
              <DynamicFieldForm
                fields={selectedTemplate.fields ?? []}
                values={fieldValues}
                isHebrew={isHebrew}
                onChange={handleFieldChange}
                errors={fieldErrors}
              />
            </SectionCard>

            <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-indigo-50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">{t('catalogs.calculatedPrice')}</p>
                    <p className="text-2xl font-bold text-brand-800">
                      {formatPrice(previewPrice, isHebrew ? 'he' : 'en')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 sm:max-w-xs sm:text-end">
                  {t('catalogs.priceHint')}
                </p>
              </div>
            </Card>
          </>
        )}

        <FormActionFooter
          saveLabel={t('catalogs.save')}
          cancelLabel={t('catalogs.cancel')}
          onCancel={() => navigate('/catalogs')}
          loading={createCatalog.isPending || updateCatalog.isPending}
        />
      </form>
    </FormPageShell>
  );
}
