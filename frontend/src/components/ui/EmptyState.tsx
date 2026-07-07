import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';

type EmptyStateProps = {
  message: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
};

export function EmptyState({ message, icon: Icon, action, children }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <p className="text-slate-500">{message}</p>
      {children}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </Card>
  );
}
