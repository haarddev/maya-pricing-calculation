import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calculator } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import * as catalogsApi from '../api/catalogs.api';
import * as templatesApi from '../api/templates.api';
import { DynamicFieldForm } from '../components/catalogs/DynamicFieldForm';
import { DownloadMenu } from '../components/catalogs/DownloadMenu';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { PageLoader } from '../components/ui/Spinner';
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedCatalog, setSavedCatalog] = useState<Catalog | null>(null);

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

  useEffect(() => {
    async function init() {
      try {
        const activeTemplates = await catalogsApi.listActiveTemplates();
        setTemplates(activeTemplates);

        if (isEdit && id) {
          const catalog = await catalogsApi.getCatalog(id);
          reset({
            name: catalog.name,
            description: catalog.description,
            status: catalog.status,
            templateId: catalog.templateId,
          });
          setFieldValues(catalog.fieldValues);
          setSavedCatalog(catalog);
          if (catalog.template) {
            setSelectedTemplate(catalog.template as Template);
          }
        }
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [id, isEdit, reset, t]);

  useEffect(() => {
    if (!templateId || isEdit) return;

    async function loadTemplate() {
      try {
        const template = await templatesApi.getTemplate(templateId);
        setSelectedTemplate(template);
        setFieldValues({});
        setFieldErrors({});
      } catch {
        setError(t('common.error'));
      }
    }

    void loadTemplate();
  }, [templateId, isEdit, t]);

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

  const onSubmit = async (data: MetaForm) => {
    if (!selectedTemplate) {
      setError(t('catalogs.selectTemplateFirst'));
      return;
    }

    if (!validateFields(selectedTemplate.fields ?? [])) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isEdit && id) {
        await catalogsApi.updateCatalog(id, {
          name: data.name,
          description: data.description,
          status: data.status,
          fieldValues,
        });
      } else {
        await catalogsApi.createCatalog({
          name: data.name,
          description: data.description,
          status: data.status,
          templateId: data.templateId,
          fieldValues,
        });
      }
      navigate('/catalogs');
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => navigate('/catalogs')} className="!px-0 self-start">
          <ArrowLeft className="h-4 w-4" />
          {t('catalogs.cancel')}
        </Button>
        {isEdit && catalogForDownload && (
          <DownloadMenu
            label={t('catalogs.download')}
            csvLabel={t('catalogs.downloadCsv')}
            jsonLabel={t('catalogs.downloadJson')}
            onDownload={(format) => downloadCatalog(catalogForDownload, format, t)}
          />
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {isEdit ? t('catalogs.edit') : t('catalogs.new')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('catalogs.formSubtitle')}</p>
      </div>

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{t('catalogs.basicInfo')}</h2>
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
        </Card>

        {selectedTemplate && (
          <>
            <Card>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{t('catalogs.fieldValues')}</h2>
                  <p className="text-sm text-slate-500">
                    {t(`pricingMethod.${selectedTemplate.pricingMethod as PricingMethod}`)}
                  </p>
                </div>
              </div>
              <DynamicFieldForm
                fields={selectedTemplate.fields ?? []}
                values={fieldValues}
                isHebrew={isHebrew}
                onChange={handleFieldChange}
                errors={fieldErrors}
              />
            </Card>

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

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={saving} className="sm:flex-1">
            {t('catalogs.save')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/catalogs')} className="sm:flex-1">
            {t('catalogs.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
