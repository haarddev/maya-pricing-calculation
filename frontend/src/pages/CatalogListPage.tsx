import { useState } from 'react';

import { Plus } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';

import { CatalogTable } from '../components/catalogs/CatalogTable';

import { DownloadMenu } from '../components/catalogs/DownloadMenu';

import { ListPageLayout } from '../components/Layout/ListPageLayout';

import { Button } from '../components/ui/Button';

import { FilterBar } from '../components/ui/FilterBar';

import { PageHeader } from '../components/ui/PageHeader';

import { SearchInput } from '../components/ui/SearchInput';

import { Select } from '../components/ui/Select';

import { useDebouncedValue } from '../hooks/useDebouncedValue';

import { useCatalogTemplates, useCatalogs, useDeleteCatalog } from '../hooks/queries/catalogs';

import type { Catalog, CatalogStatus } from '../types/catalog.types';

import { downloadCatalogs } from '../utils/catalogExport';



const ALL_STATUSES: CatalogStatus[] = ['ACTIVE', 'DISABLED', 'DRAFT'];



export function CatalogListPage() {

  const { t } = useTranslation();

  const navigate = useNavigate();

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState<CatalogStatus | ''>('');

  const [templateFilter, setTemplateFilter] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Catalog | null>(null);



  const debouncedSearch = useDebouncedValue(search);

  const { data: templates = [] } = useCatalogTemplates();

  const { data: catalogs = [], isLoading, isFetching } = useCatalogs({

    search: debouncedSearch || undefined,

    status: statusFilter || undefined,

    templateId: templateFilter || undefined,

  });

  const deleteCatalog = useDeleteCatalog();



  const confirmDelete = () => {

    if (!deleteTarget) return;

    deleteCatalog.mutate(deleteTarget.id, {

      onSuccess: () => setDeleteTarget(null),

    });

  };



  return (

    <ListPageLayout

      header={

        <PageHeader

          title={t('catalogs.title')}

          subtitle={t('catalogs.subtitle')}

          actions={

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

              <DownloadMenu

                label={t('catalogs.downloadAll')}

                disabled={catalogs.length === 0 || isLoading}

                csvLabel={t('catalogs.downloadCsv')}

                jsonLabel={t('catalogs.downloadJson')}

                onDownload={(format) => downloadCatalogs(catalogs, format, t)}

              />

              <Button onClick={() => navigate('/catalogs/new')} className="w-full sm:w-auto">

                <Plus className="h-4 w-4" />

                {t('catalogs.create')}

              </Button>

            </div>

          }

        />

      }

      filters={

        <FilterBar>

          <SearchInput label={t('catalogs.search')} value={search} onChange={setSearch} />

          <Select

            label={t('catalogs.filterStatus')}

            value={statusFilter}

            onChange={(e) => setStatusFilter(e.target.value as CatalogStatus | '')}

            options={[

              { value: '', label: t('catalogs.all') },

              ...ALL_STATUSES.map((status) => ({

                value: status,

                label: t(`catalogStatus.${status}`),

              })),

            ]}

          />

          <Select

            label={t('catalogs.filterTemplate')}

            value={templateFilter}

            onChange={(e) => setTemplateFilter(e.target.value)}

            options={[

              { value: '', label: t('catalogs.all') },

              ...templates.map((template) => ({

                value: template.id,

                label: template.name,

              })),

            ]}

          />

        </FilterBar>

      }

      isLoading={isLoading}

      isFetching={isFetching}

      deleteDialog={{

        open: Boolean(deleteTarget),

        title: t('catalogs.deleteTitle'),

        message: t('catalogs.deleteConfirm', { name: deleteTarget?.name ?? '' }),

        confirmLabel: t('catalogs.delete'),

        cancelLabel: t('catalogs.cancel'),

        loading: deleteCatalog.isPending,

        onConfirm: confirmDelete,

        onCancel: () => setDeleteTarget(null),

      }}

    >

      <CatalogTable catalogs={catalogs} onDelete={setDeleteTarget} />

    </ListPageLayout>

  );

}

