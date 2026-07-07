import { useTranslation } from 'react-i18next';
import type { LogStats } from '../../types/log.types';
import { Card } from '../ui/Card';

type LogStatsCardsProps = {
  stats: LogStats;
};

export function LogStatsCards({ stats }: LogStatsCardsProps) {
  const { t } = useTranslation();

  const cards = [
    {
      label: t('logs.stats.requests24h'),
      value: stats.requestsLast24h.toLocaleString(),
      hint: t('logs.stats.requests24hHint'),
    },
    {
      label: t('logs.stats.avgCalcTime'),
      value: `${stats.avgCalculationMs}ms`,
      hint: t('logs.stats.avgCalcTimeHint'),
    },
    {
      label: t('logs.stats.pricingCalcs'),
      value: stats.pricingCalculations.toLocaleString(),
      hint: t('logs.stats.pricingCalcsHint'),
    },
    {
      label: t('logs.stats.errorCount'),
      value: stats.errorCount.toLocaleString(),
      hint: t('logs.stats.errorCountHint'),
    },
    {
      label: t('logs.stats.successRate'),
      value: `${stats.successRate}%`,
      hint: t('logs.stats.successRateHint'),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="!p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
        </Card>
      ))}
    </div>
  );
}
