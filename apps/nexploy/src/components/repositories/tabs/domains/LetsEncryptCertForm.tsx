'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLetsEncryptCertSchema } from '@workspace/schemas-zod/repository/sslCertificate.schema';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { AlertTriangle } from 'lucide-react';
import { createLetsEncryptCert } from '@/actions/repository/sslCertificate/createLetsEncryptCert.action';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LetsEncryptCertFormProps {
    onClose: () => void;
}

export function LetsEncryptCertForm({ onClose }: LetsEncryptCertFormProps) {
    const t = useTranslations('repository.settings.ssl');
    const router = useRouter();

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        createLetsEncryptCert,
        zodResolver(createLetsEncryptCertSchema),
        {
            formProps: {
                defaultValues: { name: '', domain: '', email: '', agreedToTos: false },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('addedSuccess'));
                    router.refresh();
                    onClose();
                },
                onError: () => {
                    toast.error(t('addedError'));
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
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
                            <FormLabel>{t('domainNames')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="example.com" className="font-mono" />
                            </FormControl>
                            <FormMessage />
                            <FormDescription className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="size-3.5 shrink-0" />
                                {t('domainsMustPoint')}
                            </FormDescription>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('emailLabel')}</FormLabel>
                            <FormControl>
                                <Input {...field} type="email" placeholder="you@example.com" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="agreedToTos"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-3">
                            <div className={'flex items-center gap-3'}>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="cursor-pointer font-normal">
                                    {t('agreeToTos.prefix')}{' '}
                                    <Link
                                        href="https://letsencrypt.org/repository/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline underline-offset-4"
                                    >
                                        {t('agreeToTos.link')}
                                    </Link>
                                </FormLabel>
                            </div>
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
