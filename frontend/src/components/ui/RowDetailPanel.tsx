import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type RowDetailPanelProps = {
  children: ReactNode;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
};

export function RowDetailPanel({ children, onClose, title, closeLabel = 'Close' }: RowDetailPanelProps) {
  return (
    <div className="mx-3 my-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg ring-1 ring-slate-100 sm:mx-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        {title ? (
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}
