'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
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
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { instanceDomainSchema, instanceTlsModes } from '@workspace/schemas-zod/admin/instance.schema';
import type { InstanceTlsMode } from '@workspace/schemas-zod/admin/instance.schema';
import type { CertOption } from '@workspace/typescript-interface/traefik/certificate';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { updateInstanceDomainAction } from '@/actions/admin/updateInstanceDomain.action';
import type { InstanceDomainSettings } from '@/lib/instance/domain';

const MODE_LABEL_KEYS: Record<InstanceTlsMode, { title: string; description: string }> = {
    ip: { title: 'domainModeIp', description: 'domainModeIpDescription' },
    letsencrypt: { title: 'domainModeLetsEncrypt', description: 'domainModeLetsEncryptDescription' },
    custom: { title: 'domainModeCustom', description: 'domainModeCustomDescription' },
};

export function InstanceDomainCard({ settings }: { settings: InstanceDomainSettings }) {
    const t = useTranslations('admin.settings');
    const [isRestarting, setIsRestarting] = useState(false);
    const [applyError, setApplyError] = useState<string | null>(null);

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateInstanceDomainAction,
        zodResolver(instanceDomainSchema),
        {
            formProps: {
                defaultValues: {
                    domain: settings.domain,
                    mode: settings.mode,
                    acmeEmail: settings.acmeEmail || undefined,
                    certificateId: settings.certificateId ?? undefined,
                    fallbackIp: settings.fallbackIp ?? undefined,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data && !data.applied) {
                        setApplyError(data.error);
                        return;
                    }
                    setApplyError(null);
                    setIsRestarting(true);
                },
                onError: () => setIsRestarting(true),
            },
        },
    );

    const mode = form.watch('mode');

    const { data: certificates = [] } = useSWR<CertOption[]>(
        mode === 'custom' ? { url: '/api/ssl-certificates' } : null,
        fetcherApi,
    );
    const customCertificates = certificates.filter((certificate) => certificate.type === 'CUSTOM');

    const handleModeChange = (value: string) => {
        const nextMode = value as InstanceTlsMode;
        setApplyError(null);
        form.setValue('mode', nextMode, { shouldDirty: true });
        if (nextMode !== 'custom') form.setValue('certificateId', undefined);
        if (nextMode === 'ip') form.setValue('fallbackIp', undefined);
        form.clearErrors(['domain', 'acmeEmail', 'certificateId', 'fallbackIp']);
    };

    return (
        <Card>
            <CardHeaderWithIcon icon={Globe} title={t('domainTitle')} description={t('domainDescription')} />
            <CardContent>
                {isRestarting ? (
                    <p className="text-muted-foreground text-sm">{t('domainRestarting')}</p>
                ) : (
                    <Form {...form}>
                        <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="mode"
                                render={({ field }) => (
                                    <FormItem className="space-y-3 rounded-lg border p-3">
                                        <FormLabel>{t('domainModeLabel')}</FormLabel>
                                        <FormControl>
                                            <RadioGroup value={field.value} onValueChange={handleModeChange}>
                                                {instanceTlsModes.map((tlsMode) => (
                                                    <label
                                                        key={tlsMode}
                                                        htmlFor={`instance-tls-mode-${tlsMode}`}
                                                        className="flex cursor-pointer items-start gap-3"
                                                    >
                                                        <RadioGroupItem
                                                            id={`instance-tls-mode-${tlsMode}`}
                                                            value={tlsMode}
                                                            className="mt-0.5"
                                                        />
                                                        <div className="space-y-0.5">
                                                            <p className="font-medium text-sm leading-none">
                                                                {t(MODE_LABEL_KEYS[tlsMode].title)}
                                                            </p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {t(MODE_LABEL_KEYS[tlsMode].description)}
                                                            </p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </RadioGroup>
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
                                        <FormLabel>{mode === 'ip' ? t('domainLabelIp') : t('domainLabel')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={
                                                    mode === 'ip' ? t('domainPlaceholderIp') : t('domainPlaceholder')
                                                }
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {mode === 'custom' && (
                                <FormField
                                    control={form.control}
                                    name="certificateId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('certificateLabel')}</FormLabel>
                                            <Select
                                                value={field.value ?? ''}
                                                onValueChange={(value) => field.onChange(value || undefined)}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t('selectCertificate')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent align="start">
                                                    {customCertificates.length === 0 ? (
                                                        <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                                                            {t('noCustomCertificates')}
                                                        </div>
                                                    ) : (
                                                        customCertificates.map((certificate) => (
                                                            <SelectItem key={certificate.id} value={certificate.id}>
                                                                <span className="flex items-center gap-2">
                                                                    <ShieldCheck className="text-primary" />
                                                                    <span>{certificate.name}</span>
                                                                    <span className="font-mono text-muted-foreground text-xs">
                                                                        {certificate.domain}
                                                                    </span>
                                                                </span>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            <FormDescription>
                                                {t('certificateDescription')}{' '}
                                                <Link href="/ssl-certificates" className="underline">
                                                    {t('manageCertificates')}
                                                </Link>
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                            )}

                            {mode !== 'ip' && (
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
                                                    onChange={(event) =>
                                                        field.onChange(event.target.value || undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {mode === 'custom' && (
                                                <FormDescription>{t('acmeEmailOptionalDescription')}</FormDescription>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            )}

                            {mode !== 'ip' && (
                                <FormField
                                    control={form.control}
                                    name="fallbackIp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('fallbackIpLabel')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('domainPlaceholderIp')}
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(event) =>
                                                        field.onChange(event.target.value || undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <FormDescription>{t('fallbackIpDescription')}</FormDescription>
                                        </FormItem>
                                    )}
                                />
                            )}

                            {applyError && (
                                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-destructive text-sm">
                                    {applyError}
                                </p>
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
