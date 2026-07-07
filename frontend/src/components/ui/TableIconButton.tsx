import type { LucideIcon } from 'lucide-react';

type TableIconButtonProps = {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
};

const variantClass = {
  default: 'hover:bg-brand-50 hover:text-brand-700',
  danger: 'hover:bg-red-50 hover:text-red-600',
};

export function TableIconButton({
  icon: Icon,
  title,
  onClick,
  variant = 'default',
  disabled,
}: TableIconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-lg p-2 text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-40 ${variantClass[variant]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
