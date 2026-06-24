import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { PricingMethod, Template } from '../../types/template.types';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type TemplateTableProps = {
  templates: Template[];
  onDelete: (template: Template) => void;
};

export function TemplateTable({ templates, onDelete }: TemplateTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isHebrew = i18n.language.startsWith('he');

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(isHebrew ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (templates.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-slate-500">{t('templates.noResults')}</p>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-4 lg:hidden">
        {templates.map((template) => (
          <Card key={template.id} className="transition hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">{template.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {template.description || '—'}
                </p>
              </div>
              <StatusBadge label={t(`status.${template.status}`)} status={template.status} />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('templates.type')}
                </p>
                <p className="mt-0.5 text-slate-700">
                  {t(`pricingMethod.${template.pricingMethod as PricingMethod}`)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('templates.fieldCount')}
                </p>
                <p className="mt-0.5 text-slate-700">{template.fieldCount ?? 0}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('templates.updatedAt')}
                </p>
                <p className="mt-0.5 text-slate-700">{formatDate(template.updatedAt)}</p>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <Button
                variant="secondary"
                className="flex-1 !py-2"
                onClick={() => navigate(`/templates/${template.id}`)}
              >
                <Eye className="h-4 w-4" />
                {t('templates.view')}
              </Button>
              <Button
                variant="ghost"
                className="!px-3"
                onClick={() => navigate(`/templates/${template.id}`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="danger"
                className="!px-3"
                onClick={() => onDelete(template)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden !p-0 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-start">
                <th className="px-5 py-3 font-semibold text-slate-600">{t('templates.name')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('templates.description')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('templates.status')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('templates.type')}</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600">{t('templates.fieldCount')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('templates.updatedAt')}</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600">{t('templates.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/60 last:border-0"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">{template.name}</td>
                  <td className="max-w-[220px] truncate px-5 py-4 text-slate-600" title={template.description}>
                    {template.description || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge label={t(`status.${template.status}`)} status={template.status} />
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {t(`pricingMethod.${template.pricingMethod as PricingMethod}`)}
                  </td>
                  <td className="px-5 py-4 text-center text-slate-600">{template.fieldCount ?? 0}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(template.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title={t('templates.view')}
                        onClick={() => navigate(`/templates/${template.id}`)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('templates.edit')}
                        onClick={() => navigate(`/templates/${template.id}`)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('templates.delete')}
                        onClick={() => onDelete(template)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export function EmptyTemplatesCTA({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Plus className="h-8 w-8" />
      </div>
      <p className="mb-4 text-slate-500">{t('templates.noResults')}</p>
      <Button onClick={onCreate}>{t('templates.create')}</Button>
    </Card>
  );
}
