import type { ReactNode } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { FetchingWrapper } from '../ui/FetchingWrapper';
import { PageLoader } from '../ui/Spinner';

type DeleteDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

type ListPageLayoutProps = {
  header: ReactNode;
  filters: ReactNode;
  isLoading: boolean;
  isFetching?: boolean;
  children: ReactNode;
  deleteDialog?: DeleteDialogProps;
};

export function ListPageLayout({
  header,
  filters,
  isLoading,
  isFetching = false,
  children,
  deleteDialog,
}: ListPageLayoutProps) {
  return (
    <div className="space-y-6">
      {header}
      {filters}

      {isLoading ? (
        <PageLoader />
      ) : (
        <FetchingWrapper isFetching={isFetching}>{children}</FetchingWrapper>
      )}

      {deleteDialog && (
        <ConfirmDialog
          open={deleteDialog.open}
          title={deleteDialog.title}
          message={deleteDialog.message}
          confirmLabel={deleteDialog.confirmLabel}
          cancelLabel={deleteDialog.cancelLabel}
          loading={deleteDialog.loading}
          onConfirm={deleteDialog.onConfirm}
          onCancel={deleteDialog.onCancel}
        />
      )}
    </div>
  );
}
