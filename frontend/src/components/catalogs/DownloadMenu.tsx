import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import type { CatalogExportFormat } from '../../utils/catalogExport';

type DownloadMenuProps = {
  label: string;
  disabled?: boolean;
  onDownload: (format: CatalogExportFormat) => void;
  csvLabel: string;
  jsonLabel: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
};

const variantClass = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/25',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function DownloadMenu({
  label,
  disabled,
  onDownload,
  csvLabel,
  jsonLabel,
  variant = 'secondary',
  className = '',
}: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClass[variant]}`}
      >
        <Download className="h-4 w-4" />
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute end-0 z-20 mt-2 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <MenuItem onClick={() => { onDownload('csv'); setOpen(false); }}>{csvLabel}</MenuItem>
          <MenuItem onClick={() => { onDownload('json'); setOpen(false); }}>{jsonLabel}</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-4 py-2.5 text-start text-sm text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </button>
  );
}
