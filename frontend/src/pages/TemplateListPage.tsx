import { useState } from 'react';

import { Plus } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';

import { DownloadMenu } from '../components/catalogs/DownloadMenu';

import { TemplateTable } from '../components/templates/TemplateTable';

import { ListPageLayout } from '../components/Layout/ListPageLayout';

import { Button } from '../components/ui/Button';

import { FilterBar } from '../components/ui/FilterBar';

import { PageHeader } from '../components/ui/PageHeader';

import { SearchInput } from '../components/ui/SearchInput';

import { Select } from '../components/ui/Select';

import { useDebouncedValue } from '../hooks/useDebouncedValue';

import { useDeleteTemplate, useTemplates } from '../hooks/queries/templates';

import type { PricingMethod, Template, TemplateStatus } from '../types/template.types';

import { downloadAllTemplates } from '../utils/templateExport';

import { showError } from '../utils/toast';



const ALL_STATUSES: TemplateStatus[] = ['ACTIVE', 'DISABLED', 'DRAFT', 'EXPIRED'];

const ALL_METHODS: PricingMethod[] = [
  'PRICE_BY_DESTINATION',
  'PRICE_BY_HOURS',
  'PRICE_BY_ROUTE',
  'PRICE_BY_DISTANCE',
  'PRICE_BY_AREA',
  'PRICE_BY_PASSENGERS',
  'PRICE_BY_SKU',
  'PRICE_BY_MINUTES',
  'PRICE_BY_KM_AND_HOURS',
];



export function TemplateListPage() {

  const { t } = useTranslation();

  const navigate = useNavigate();

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState<TemplateStatus | ''>('');

  const [typeFilter, setTypeFilter] = useState<PricingMethod | ''>('');

  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  const [downloadingAll, setDownloadingAll] = useState(false);



  const debouncedSearch = useDebouncedValue(search);

  const { data: templates = [], isLoading, isFetching } = useTemplates({

    search: debouncedSearch || undefined,

    status: statusFilter || undefined,

    pricingMethod: typeFilter || undefined,

  });

  const deleteTemplate = useDeleteTemplate();



  const confirmDelete = () => {

    if (!deleteTarget) return;

    deleteTemplate.mutate(deleteTarget.id, {

      onSuccess: () => setDeleteTarget(null),

    });

  };

  const handleDownloadAll = async (format: 'csv' | 'json') => {
    setDownloadingAll(true);
    try {
      await downloadAllTemplates(templates, format, t);
    } catch {
      showError();
    } finally {
      setDownloadingAll(false);
    }
  };



  return (

    <ListPageLayout

      header={

        <PageHeader

          title={t('templates.title')}

          subtitle={`${templates.length} ${t('templates.title').toLowerCase()}`}

          actions={

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

              <DownloadMenu

                label={t('templates.downloadAll')}

                disabled={templates.length === 0 || isLoading || downloadingAll}

                csvLabel={t('templates.downloadCsv')}

                jsonLabel={t('templates.downloadJson')}

                onDownload={(format) => void handleDownloadAll(format)}

              />

              <Button onClick={() => navigate('/templates/new')} className="w-full sm:w-auto">

                <Plus className="h-4 w-4" />

                {t('templates.create')}

              </Button>

            </div>

          }

        />

      }

      filters={

        <FilterBar>

          <SearchInput label={t('templates.search')} value={search} onChange={setSearch} />

          <Select

            label={t('templates.filterStatus')}

            value={statusFilter}

            onChange={(e) => setStatusFilter(e.target.value as TemplateStatus | '')}

            options={[

              { value: '', label: t('templates.all') },

              ...ALL_STATUSES.map((status) => ({

                value: status,

                label: t(`status.${status}`),

              })),

            ]}

          />

          <Select

            label={t('templates.filterType')}

            value={typeFilter}

            onChange={(e) => setTypeFilter(e.target.value as PricingMethod | '')}

            options={[

              { value: '', label: t('templates.all') },

              ...ALL_METHODS.map((method) => ({

                value: method,

                label: t(`pricingMethod.${method}`),

              })),

            ]}

          />

        </FilterBar>

      }

      isLoading={isLoading}

      isFetching={isFetching}

      deleteDialog={{

        open: Boolean(deleteTarget),

        title: t('templates.deleteTitle'),

        message: t('templates.deleteConfirmNamed', { name: deleteTarget?.name ?? '' }),

        confirmLabel: t('templates.delete'),

        cancelLabel: t('templates.cancel'),

        loading: deleteTemplate.isPending,

        onConfirm: confirmDelete,

        onCancel: () => setDeleteTarget(null),

      }}

    >

      <TemplateTable templates={templates} onDelete={setDeleteTarget} />

    </ListPageLayout>

  );

}

