'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { instanceDomainSchema } from '@workspace/schemas-zod/admin/traefikFile.schema';
import { updateInstanceDomainAction } from '@/actions/admin/updateInstanceDomain.action';
import type { InstanceDomainSettings } from '@/lib/instance/domain';

export function InstanceDomainCard({ settings }: { settings: InstanceDomainSettings }) {
    const t = useTranslations('admin.settings');
    const [isRestarting, setIsRestarting] = useState(false);

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateInstanceDomainAction,
        zodResolver(instanceDomainSchema),
        {
            formProps: {
                defaultValues: {
                    domain: settings.domain,
                    useTls: settings.useTls,
                    acmeEmail: settings.acmeEmail || undefined,
                },
            },
            actionProps: {
                onSuccess: () => setIsRestarting(true),
                onError: () => setIsRestarting(true),
            },
        },
    );

    const useTls = form.watch('useTls');

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Globe}
                title={t('domainTitle')}
                description={t('domainDescription')}
            />
            <CardContent>
                {isRestarting ? (
                    <p className="text-muted-foreground text-sm">{t('domainRestarting')}</p>
                ) : (
                    <Form {...form}>
                        <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="useTls"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                            <div className="flex flex-col">
                                                <span className="text-base">
                                                    {t('domainModeLabel')}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {t('domainModeDescription')}
                                                </span>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="domain"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {useTls ? t('domainLabel') : t('domainLabelIp')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={
                                                    useTls
                                                        ? t('domainPlaceholder')
                                                        : t('domainPlaceholderIp')
                                                }
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {useTls && (
                                <FormField
                                    control={form.control}
                                    name="acmeEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('acmeEmailLabel')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder={t('acmeEmailPlaceholder')}
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <p className="text-muted-foreground text-xs">{t('domainWarning')}</p>

                            <Button
                                type="submit"
                                disabled={action.isPending || !form.formState.isDirty}
                                isLoading={action.isPending}
                                className="self-end"
                            >
                                {t('save')}
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
