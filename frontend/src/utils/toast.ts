import { toast } from 'sonner';
import i18n from '../i18n';

export function showSuccess(key: string, params?: Record<string, string>) {
  toast.success(i18n.t(key, params));
}

export function showError(key = 'toast.error') {
  toast.error(i18n.t(key));
}
