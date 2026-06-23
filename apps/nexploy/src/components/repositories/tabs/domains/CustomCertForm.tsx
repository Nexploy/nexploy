'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCustomCertSchema } from '@workspace/schemas-zod/repository/sslCertificate.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { createCustomCert } from '@/actions/repository/sslCertificate/createCustomCert.action';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface CustomCertFormProps {
    onClose: () => void;
}

export function CustomCertForm({ onClose }: CustomCertFormProps) {
    const t = useTranslations('repository.settings.ssl');
    const router = useRouter();

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        createCustomCert,
        zodResolver(createCustomCertSchema),
        {
            formProps: { defaultValues: { name: '', domain: '', certificate: '', privateKey: '' } },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('addedSuccess'));
                    router.refresh();
                    onClose();
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <div className="grid items-start gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('name')}</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder={t('namePlaceholder')} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('domain')}</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="example.com"
                                        className="font-mono"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="certificate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('certificate')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                    className="h-32 font-mono text-xs"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="privateKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('privateKey')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                    className="h-32 font-mono text-xs"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                        {t('save')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
