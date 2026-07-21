import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { FormPageShell } from '../components/Layout/FormPageShell';
import { BackButton } from '../components/ui/BackButton';
import { FormActionFooter } from '../components/ui/FormActionFooter';
import { Input } from '../components/ui/Input';
import { SectionCard } from '../components/ui/SectionCard';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { PageLoader } from '../components/ui/Spinner';
import {
  useCreateCustomer,
  useCustomer,
  useUpdateCustomer,
} from '../hooks/queries/customers';

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

type FormValues = z.infer<typeof schema>;

export function CustomerFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: customer, isLoading } = useCustomer(id);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!customer) return;
    reset({
      name: customer.name,
      description: customer.description,
      status: customer.status,
    });
  }, [customer, reset]);

  const onSubmit = handleSubmit((values) => {
    if (isEdit) {
      updateCustomer.mutate(values, {
        onSuccess: () => navigate('/customers'),
      });
      return;
    }
    createCustomer.mutate(values, {
      onSuccess: (created) => navigate(`/customers/${created.id}`),
    });
  });

  if (isEdit && isLoading) return <PageLoader />;

  return (
    <FormPageShell
      title={isEdit ? t('customers.edit') : t('customers.new')}
      subtitle={isEdit ? customer?.name : t('customers.newHint')}
      back={<BackButton to="/customers" />}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <SectionCard title={t('customers.details')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label={t('customers.name')}
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label={t('customers.description')}
                rows={3}
                {...register('description')}
              />
            </div>
            <Select
              label={t('customers.status')}
              options={[
                { value: 'ACTIVE', label: t('customers.statuses.ACTIVE') },
                { value: 'DISABLED', label: t('customers.statuses.DISABLED') },
              ]}
              {...register('status')}
            />
          </div>
          {isEdit && customer && (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
              {t('customers.id')}: {customer.id}
            </p>
          )}
        </SectionCard>

        <FormActionFooter
          loading={createCustomer.isPending || updateCustomer.isPending}
          onCancel={() => navigate('/customers')}
          saveLabel={isEdit ? t('customers.save') : t('customers.create')}
          cancelLabel={t('customers.cancel')}
        />
      </form>
    </FormPageShell>
  );
}
