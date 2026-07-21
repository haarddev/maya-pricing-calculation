import { useEffect, useMemo, useState } from 'react';
import { Calculator, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import * as pricingApi from '../api/pricing.api';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageBadge } from '../components/ui/PageBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { Select } from '../components/ui/Select';
import { useCatalogs } from '../hooks/queries/catalogs';
import { useCustomers } from '../hooks/queries/customers';
import { useFormatPrice } from '../hooks/useFormatPrice';
import type {
  PricingMethod,
  ReportTripStatus,
  ReportValidationRow,
} from '../types/pricing.types';

const VEHICLES = ['Bus', 'Minibus', 'Van', 'Sedan'];
const TIERS = ['Up to 2', 'Up to 4', 'Larger group'];

type MethodKey = PricingMethod | 'KIVUNIM';

type MethodFormConfig = {
  key: MethodKey;
  label: string;
  apiMethod: PricingMethod;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'time';
    options?: string[];
    required?: boolean;
  }>;
};

const METHOD_FORMS: MethodFormConfig[] = [
  {
    key: 'KIVUNIM',
    label: 'Price by Route (Kivunim — real client data)',
    apiMethod: 'PRICE_BY_ROUTE',
    fields: [
      { name: 'route_name', label: 'Route', type: 'select', required: true },
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['Bus', 'Minibus', 'Van'], required: true },
      { name: 'start_time', label: 'Start Time', type: 'time' },
    ],
  },
  {
    key: 'PRICE_BY_DESTINATION',
    label: 'Price by Destination',
    apiMethod: 'PRICE_BY_DESTINATION',
    fields: [
      { name: 'destination', label: 'Destination', type: 'select', required: true },
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: VEHICLES, required: true },
    ],
  },
  {
    key: 'PRICE_BY_AREA',
    label: 'Price by Area',
    apiMethod: 'PRICE_BY_AREA',
    fields: [
      { name: 'area_name', label: 'Area', type: 'select', required: true },
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: VEHICLES, required: true },
    ],
  },
  {
    key: 'PRICE_BY_PASSENGERS',
    label: 'Price by Passengers',
    apiMethod: 'PRICE_BY_PASSENGERS',
    fields: [
      { name: 'passenger_tier', label: 'Passenger Tier', type: 'select', options: TIERS, required: true },
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: VEHICLES, required: true },
    ],
  },
  {
    key: 'PRICE_BY_SKU',
    label: 'Price by SKU',
    apiMethod: 'PRICE_BY_SKU',
    fields: [{ name: 'sku', label: 'SKU', type: 'select', required: true }],
  },
  {
    key: 'PRICE_BY_HOURS',
    label: 'Price by Hours',
    apiMethod: 'PRICE_BY_HOURS',
    fields: [
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: VEHICLES, required: true },
      { name: 'hours', label: 'Hours', type: 'number', required: true },
    ],
  },
  {
    key: 'PRICE_BY_MINUTES',
    label: 'Price by Minutes',
    apiMethod: 'PRICE_BY_MINUTES',
    fields: [
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: VEHICLES, required: true },
      { name: 'minutes', label: 'Minutes', type: 'number', required: true },
    ],
  },
  {
    key: 'PRICE_BY_DISTANCE',
    label: 'Price by Distance',
    apiMethod: 'PRICE_BY_DISTANCE',
    fields: [
      { name: 'route_number', label: 'Route / Line Number', type: 'select', required: true },
      { name: 'km', label: 'Kilometers', type: 'number', required: true },
    ],
  },
  {
    key: 'PRICE_BY_KM_AND_HOURS',
    label: 'Price by Km + Hours',
    apiMethod: 'PRICE_BY_KM_AND_HOURS',
    fields: [
      { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: VEHICLES, required: true },
      { name: 'km', label: 'Kilometers', type: 'number', required: true },
      { name: 'hours', label: 'Hours', type: 'number', required: true },
    ],
  },
];

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = (error.response?.data as { error?: string } | undefined)?.error;
    if (apiError) return apiError;
  }
  return error instanceof Error ? error.message : String(error);
}

function statusTone(status: ReportTripStatus) {
  switch (status) {
    case 'match':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'mismatch':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

export function PricingCheckPage() {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const { data: customers = [] } = useCustomers({ status: 'ACTIVE' });
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    if (customerId || customers.length === 0) return;
    setCustomerId(customers[0].id);
  }, [customerId, customers]);

  const { data: catalogs = [] } = useCatalogs({
    status: 'ACTIVE',
    customerId: customerId || undefined,
  });

  const [methodKey, setMethodKey] = useState<MethodKey>('KIVUNIM');
  const [formValues, setFormValues] = useState<Record<string, string>>({
    vehicle_type: 'Bus',
  });
  const [quantity, setQuantity] = useState('1');
  const [tripFilter, setTripFilter] = useState<'all' | ReportTripStatus>('all');

  const methodConfig = METHOD_FORMS.find((m) => m.key === methodKey)!;

  const { data: methods = [] } = useQuery({
    queryKey: ['pricing', 'methods'],
    queryFn: pricingApi.listPricingMethods,
  });

  const methodCatalogs = useMemo(() => {
    if (methodKey === 'KIVUNIM') {
      return catalogs.filter((c) => c.template?.name?.startsWith('Kivunim'));
    }
    return catalogs.filter((c) => c.template?.pricingMethod === methodKey);
  }, [catalogs, methodKey]);

  const templateId = methodCatalogs[0]?.templateId;

  const selectOptions = useMemo(() => {
    const opts: Record<string, { value: string; label: string }[]> = {};

    if (methodKey === 'KIVUNIM') {
      const seen = new Map<string, string>();
      for (const catalog of methodCatalogs) {
        const routeName = catalog.fieldValues.route_name;
        if (typeof routeName !== 'string' || !routeName) continue;
        if (seen.has(routeName)) continue;
        const routeEn = catalog.fieldValues.route_name_en;
        const label =
          typeof routeEn === 'string' && routeEn
            ? `${routeEn} — ${catalog.template?.name ?? ''}`
            : routeName;
        seen.set(routeName, label);
      }
      opts.route_name = [...seen.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    } else {
      const keyFields = methodConfig.fields
        .filter((f) => f.type === 'select' && !f.options)
        .map((f) => f.name);
      for (const field of keyFields) {
        const values = new Set<string>();
        for (const catalog of methodCatalogs) {
          const v = catalog.fieldValues[field];
          if (typeof v === 'string' || typeof v === 'number') values.add(String(v));
        }
        opts[field] = [...values].sort().map((v) => ({ value: v, label: v }));
      }
    }

    return opts;
  }, [methodCatalogs, methodKey, methodConfig]);

  const calculate = useMutation({ mutationFn: pricingApi.calculatePrice });
  const report = useMutation({
    mutationFn: (method: MethodKey) =>
      pricingApi.validateReport(method === 'KIVUNIM' ? 'KIVUNIM' : method),
  });

  const setField = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    setFormValues({ vehicle_type: 'Bus' });
    calculate.reset();
    report.reset();
    setTripFilter('all');
  };

  const handleMethodChange = (key: MethodKey) => {
    setMethodKey(key);
    setFormValues({ vehicle_type: 'Bus' });
    calculate.reset();
    report.reset();
    setTripFilter('all');
  };

  const handleCalculate = () => {
    if (!customerId) return;

    const values: Record<string, string | number> = {};
    for (const field of methodConfig.fields) {
      const raw = formValues[field.name];
      if (raw === undefined || raw === '') continue;
      values[field.name] = field.type === 'number' ? Number(raw) : raw;
    }

    if (methodKey === 'KIVUNIM') {
      calculate.mutate({
        customer_id: customerId,
        pricing_method: 'PRICE_BY_ROUTE',
        template_id: templateId,
        route_name: values.route_name as string,
        vehicle_type: values.vehicle_type as string,
        start_time: (values.start_time as string) || undefined,
        quantity: quantity ? Number(quantity) : undefined,
      });
      return;
    }

    calculate.mutate({
      customer_id: customerId,
      pricing_method: methodConfig.apiMethod,
      template_id: templateId,
      values,
      quantity: quantity ? Number(quantity) : undefined,
    });
  };

  const reportData = report.data;
  const shownTrips: ReportValidationRow[] =
    reportData?.trips.filter((trip) => (tripFilter === 'all' ? true : trip.status === tripFilter)) ??
    [];

  const methodOptions = [
    { value: 'KIVUNIM', label: 'Price by Route (Kivunim — real client data)' },
    ...METHOD_FORMS.filter((m) => m.key !== 'KIVUNIM').map((m) => ({
      value: m.key,
      label: m.label,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<PageBadge icon={Calculator} label={t('pricing.badge')} />}
        title={t('pricing.title')}
        subtitle={t('pricing.subtitle')}
      />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('pricing.customer')}
            value={customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            options={[
              { value: '', label: t('pricing.selectCustomer') },
              ...customers.map((customer) => ({
                value: customer.id,
                label: customer.name,
              })),
            ]}
          />
          <Select
            label={t('pricing.pricingMethod')}
            value={methodKey}
            onChange={(e) => handleMethodChange(e.target.value as MethodKey)}
            options={methodOptions}
          />
        </div>
        {customerId && (
          <p className="mt-2 font-mono text-[11px] text-slate-400">
            {t('pricing.customerId')}: {customerId}
          </p>
        )}
        {methods.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {t('pricing.catalogsLoaded', { count: methodCatalogs.length })}
          </p>
        )}
      </Card>

      <SectionCard title={t('pricing.singleCheck')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methodConfig.fields.map((field) => {
            if (field.type === 'select') {
              const options = field.options
                ? field.options.map((o) => ({ value: o, label: o }))
                : selectOptions[field.name] ?? [];
              return (
                <Select
                  key={field.name}
                  label={field.label}
                  value={formValues[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                  options={[
                    { value: '', label: t('pricing.selectValue') },
                    ...options,
                  ]}
                />
              );
            }
            return (
              <Input
                key={field.name}
                label={field.label}
                type={field.type === 'time' ? 'time' : field.type}
                min={field.type === 'number' ? 0 : undefined}
                step={field.type === 'number' ? 'any' : undefined}
                value={formValues[field.name] ?? ''}
                onChange={(e) => setField(field.name, e.target.value)}
              />
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:w-36">
            <Input
              label={t('pricing.quantity')}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCalculate}
            loading={calculate.isPending}
            disabled={!customerId}
            className="w-full sm:w-auto"
          >
            <Calculator className="h-4 w-4" />
            {t('pricing.calculate')}
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {calculate.isError && <Alert variant="error">{extractErrorMessage(calculate.error)}</Alert>}
          {calculate.data && (
            <Card className="!border-emerald-200 !bg-emerald-50/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-600">{calculate.data.catalog_name}</p>
                  <p className="text-xs text-slate-500">{calculate.data.template_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {calculate.data.pricing_method}
                    {calculate.data.vehicle_type ? ` · ${calculate.data.vehicle_type}` : ''}
                    {calculate.data.quantity > 1 &&
                      ` · ${formatPrice(calculate.data.unit_price)} × ${calculate.data.quantity}`}
                  </p>
                </div>
                <p className="shrink-0 text-3xl font-bold text-emerald-700">
                  {formatPrice(calculate.data.total_price)}
                </p>
              </div>
            </Card>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t('pricing.reportCheck')}
        actions={
          <Button
            onClick={() => report.mutate(methodKey)}
            loading={report.isPending}
            className="w-full sm:w-auto"
          >
            <PlayCircle className="h-4 w-4" />
            {t('pricing.runReportCheck')}
          </Button>
        }
      >
        <p className="text-sm text-slate-500">
          {methodKey === 'KIVUNIM' ? t('pricing.reportCheckHint') : t('pricing.reportCheckHintSynthetic')}
        </p>

        {report.isError && (
          <div className="mt-4">
            <Alert variant="error">{extractErrorMessage(report.error)}</Alert>
          </div>
        )}

        {reportData && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card className="!p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{reportData.summary.total}</p>
                <p className="text-xs font-medium text-slate-500">{t('pricing.statTotal')}</p>
              </Card>
              <Card className="!p-4 text-center !border-emerald-200">
                <p className="text-2xl font-bold text-emerald-700">
                  {reportData.summary.matched}/{reportData.summary.covered}
                </p>
                <p className="text-xs font-medium text-slate-500">{t('pricing.statMatched')}</p>
              </Card>
              <Card className={`!p-4 text-center ${reportData.summary.mismatched > 0 ? '!border-red-300' : ''}`}>
                <p className={`text-2xl font-bold ${reportData.summary.mismatched > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                  {reportData.summary.mismatched}
                </p>
                <p className="text-xs font-medium text-slate-500">{t('pricing.statMismatched')}</p>
              </Card>
              <Card className="!p-4 text-center !border-amber-200">
                <p className="text-2xl font-bold text-amber-700">{reportData.summary.custom}</p>
                <p className="text-xs font-medium text-slate-500">{t('pricing.statCustom')}</p>
              </Card>
            </div>

            <Alert variant={reportData.summary.mismatched === 0 ? 'success' : 'error'}>
              {reportData.summary.mismatched === 0
                ? t('pricing.reportAllGood', {
                    matched: reportData.summary.matched,
                    custom: reportData.summary.custom,
                  })
                : t('pricing.reportHasIssues', { count: reportData.summary.mismatched })}
            </Alert>

            <div className="flex flex-wrap gap-2">
              {(['all', 'match', 'mismatch', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTripFilter(filter)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    tripFilter === filter
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t(`pricing.filter.${filter}`)}{' '}
                  (
                  {filter === 'all'
                    ? reportData.summary.total
                    : reportData.summary[
                        filter === 'match' ? 'matched' : filter === 'mismatch' ? 'mismatched' : 'custom'
                      ]}
                  )
                </button>
              ))}
            </div>

            <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 text-start">{t('pricing.colDate')}</th>
                    <th className="px-3 py-2.5 text-start">{t('pricing.colTime')}</th>
                    <th className="px-3 py-2.5 text-start">{t('pricing.colTrip')}</th>
                    <th className="px-3 py-2.5 text-start">{t('pricing.colVehicle')}</th>
                    <th className="px-3 py-2.5 text-end">{t('pricing.colBilled')}</th>
                    <th className="px-3 py-2.5 text-end">{t('pricing.colEngine')}</th>
                    <th className="px-3 py-2.5 text-start">{t('pricing.colStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shownTrips.map((trip, index) => (
                    <tr key={index} className="bg-white">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">{trip.date}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {trip.startTime ?? '—'}
                      </td>
                      <td className="max-w-[320px] truncate px-3 py-2 text-slate-700">
                        {trip.description}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {trip.vehicleRaw}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-end font-medium text-slate-900">
                        {formatPrice(trip.billedPrice)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-end font-medium text-slate-900">
                        {trip.enginePrice === null ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          formatPrice(trip.enginePrice)
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone(trip.status)}`}
                        >
                          {t(`pricing.status.${trip.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
