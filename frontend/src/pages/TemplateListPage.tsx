import { useCallback, useEffect, useState } from 'react';

import { Plus, Search } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';

import * as templatesApi from '../api/templates.api';

import { TemplateTable } from '../components/templates/TemplateTable';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';
import { showError, showSuccess } from '../utils/toast';

import type { PricingMethod, Template, TemplateStatus } from '../types/template.types';



const ALL_STATUSES: TemplateStatus[] = ['ACTIVE', 'DISABLED', 'DRAFT', 'EXPIRED'];

const ALL_METHODS: PricingMethod[] = [

  'PRICE_BY_DESTINATION',

  'PRICE_BY_HOURS',

  'PRICE_BY_ROUTE',

  'PRICE_BY_DISTANCE',

  'PRICE_BY_AREA',

];



export function TemplateListPage() {

  const { t } = useTranslation();

  const navigate = useNavigate();

  const [templates, setTemplates] = useState<Template[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState<TemplateStatus | ''>('');

  const [typeFilter, setTypeFilter] = useState<PricingMethod | ''>('');

  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  const [deleting, setDeleting] = useState(false);



  const loadTemplates = useCallback(async () => {

    setLoading(true);

    try {

      const data = await templatesApi.listTemplates({

        search: search || undefined,

        status: statusFilter || undefined,

        pricingMethod: typeFilter || undefined,

      });

      setTemplates(data);

    } catch {

      showError();

    } finally {

      setLoading(false);

    }

  }, [search, statusFilter, typeFilter, t]);



  useEffect(() => {

    const timer = setTimeout(() => {

      void loadTemplates();

    }, 300);

    return () => clearTimeout(timer);

  }, [loadTemplates]);



  const confirmDelete = async () => {

    if (!deleteTarget) return;

    setDeleting(true);

    try {

      await templatesApi.deleteTemplate(deleteTarget.id);

      showSuccess('toast.templateDeleted');

      setDeleteTarget(null);

      await loadTemplates();

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

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('templates.title')}</h1>

          <p className="mt-1 text-sm text-slate-500">

            {templates.length} {t('templates.title').toLowerCase()}

          </p>

        </div>

        <Button onClick={() => navigate('/templates/new')} className="w-full sm:w-auto">

          <Plus className="h-4 w-4" />

          {t('templates.create')}

        </Button>

      </div>



      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="relative">

            <label className="mb-1.5 block text-sm font-medium text-slate-700">

              {t('templates.search')}

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

        </div>

      </div>



      {loading ? (

        <PageLoader />

      ) : (

        <TemplateTable templates={templates} onDelete={setDeleteTarget} />

      )}



      <ConfirmDialog

        open={Boolean(deleteTarget)}

        title={t('templates.deleteTitle')}

        message={t('templates.deleteConfirmNamed', { name: deleteTarget?.name ?? '' })}

        confirmLabel={t('templates.delete')}

        cancelLabel={t('templates.cancel')}

        loading={deleting}

        onConfirm={() => void confirmDelete()}

        onCancel={() => setDeleteTarget(null)}

      />

    </div>

  );

}


