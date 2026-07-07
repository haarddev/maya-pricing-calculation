import { Button } from './Button';

type FormActionFooterProps = {
  saveLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  loading?: boolean;
};

export function FormActionFooter({
  saveLabel,
  cancelLabel,
  onCancel,
  loading,
}: FormActionFooterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button type="submit" loading={loading} className="sm:flex-1">
        {saveLabel}
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} className="sm:flex-1">
        {cancelLabel}
      </Button>
    </div>
  );
}
