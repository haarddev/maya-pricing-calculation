import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Route, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/SettingsContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { showError, showSuccess } from '../utils/toast';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const { appName } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/templates';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  if (isAuthenticated) return null;

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      showSuccess('toast.loginSuccess');
      navigate('/templates', { replace: true });
    } catch {
      showError('auth.loginError');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-900" />
        <div className="absolute -end-24 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 start-10 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <Route className="h-7 w-7" />
          </div>
          <h1 className="max-w-md text-4xl font-bold leading-tight text-white">
            {appName}
          </h1>
          <p className="mt-4 max-w-sm text-lg text-indigo-100">
            {t('templates.title')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
          <ShieldCheck className="h-8 w-8 shrink-0" />
          <p className="text-sm text-indigo-50">
            Flexible pricing templates for travel & transportation services in Israel.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Route className="h-5 w-5" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">{appName}</h1>
            </div>
            <LanguageSwitcher />
          </div>

          <Card className="shadow-xl shadow-slate-200/60">
            <div className="mb-6 hidden items-center justify-between lg:flex">
              <h2 className="text-2xl font-bold text-slate-900">{t('auth.loginTitle')}</h2>
              <LanguageSwitcher />
            </div>
            <h2 className="mb-6 text-2xl font-bold text-slate-900 lg:hidden">{t('auth.loginTitle')}</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                {...register('email')}
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                error={errors.email?.message}
              />
              <Input
                {...register('password')}
                label={t('auth.password')}
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
              />
              <Button type="submit" fullWidth loading={isSubmitting} className="mt-2 !py-3">
                {t('auth.login')}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
