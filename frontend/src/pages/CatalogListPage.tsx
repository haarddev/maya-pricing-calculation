import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as catalogsApi from '../api/catalogs.api';
import { CatalogTable } from '../components/catalogs/CatalogTable';
import { DownloadMenu } from '../components/catalogs/DownloadMenu';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';
import { showError, showSuccess } from '../utils/toast';
import type { Catalog, CatalogStatus } from '../types/catalog.types';
import type { Template } from '../types/template.types';
import { downloadCatalogs } from '../utils/catalogExport';
const ALL_STATUSES: CatalogStatus[] = ['ACTIVE', 'DISABLED', 'DRAFT'];

export function CatalogListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CatalogStatus | ''>('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Catalog | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalogsApi.listCatalogs({
        search: search || undefined,
        status: statusFilter || undefined,
        templateId: templateFilter || undefined,
      });
      setCatalogs(data);
    } catch {
      showError();
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, templateFilter, t]);

  useEffect(() => {
    void catalogsApi.listActiveTemplates().then(setTemplates).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCatalogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadCatalogs]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await catalogsApi.deleteCatalog(deleteTarget.id);
      showSuccess('toast.catalogDeleted');
      setDeleteTarget(null);
      await loadCatalogs();
    } catch {
      showError();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('catalogs.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('catalogs.subtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <DownloadMenu
            label={t('catalogs.downloadAll')}
            disabled={catalogs.length === 0 || loading}
            csvLabel={t('catalogs.downloadCsv')}
            jsonLabel={t('catalogs.downloadJson')}
            onDownload={(format) => downloadCatalogs(catalogs, format, t)}
          />
          <Button onClick={() => navigate('/catalogs/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t('catalogs.create')}
          </Button>
        </div>      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('catalogs.search')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
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
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <CatalogTable catalogs={catalogs} onDelete={setDeleteTarget} />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('catalogs.deleteTitle')}
        message={t('catalogs.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('catalogs.delete')}
        cancelLabel={t('catalogs.cancel')}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
