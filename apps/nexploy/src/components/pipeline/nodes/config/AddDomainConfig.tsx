'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { Info, ShieldCheck } from 'lucide-react';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore.ts';
import { useEnvironmentContainers } from '@/hooks/sse/useEnvironmentContainers';
import { CloudflareDomainSelector } from '@/components/domains/CloudflareDomainSelector';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

interface CertOption {
    id: string;
    name: string;
    type: 'LETS_ENCRYPT' | 'CUSTOM';
    domain: string;
}

export function AddDomainConfig() {
    const t = useTranslations('repository.pipeline.config');
    const tDomains = useTranslations('repository.settings.domains');
    const form = useFormContext();

    const httpsEnabled = form.watch('https');
    const cloudflareZoneId = form.watch('cloudflareZoneId');

    const { data: certificates = [] } = useSWR<CertOption[]>(
        httpsEnabled ? { url: '/api/ssl-certificates' } : null,
        fetcherApi,
    );

    const environmentId = usePipelineEnvironmentId();
    const environment = useEnvironmentStore((s) =>
        s.environments.find((environment) => environment.id === environmentId),
    );

    const isRemoteEnvironment =
        environment?.connectionType === 'TCP' || environment?.connectionType === 'TCP_TLS';

    const { containers } = useEnvironmentContainers(environmentId);
    const containerOptions = containers.map((c) => ({ value: c.name, label: c.name }));

    return (
        <div className="space-y-4">
            {isRemoteEnvironment && (
                <Alert variant={'info'}>
                    <Info />
                    <AlertDescription>{tDomains('remotePortHint')}</AlertDescription>
                </Alert>
            )}
            <CloudflareDomainSelector form={form} />
            <div className="grid items-start gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addDomainHost')}</FormLabel>
                            <FormControl>
                                <RefAware value={field.value} onChange={field.onChange}>
                                    <Input
                                        {...field}
                                        placeholder={t('domainPlaceholder')}
                                        className="font-mono"
                                        readOnly={!!cloudflareZoneId}
                                        disabled={!!cloudflareZoneId}
                                    />
                                </RefAware>
                            </FormControl>
                            {cloudflareZoneId ? (
                                <FormDescription>{tDomains('managedByCloudflare')}</FormDescription>
                            ) : (
                                <FormMessage className="text-xs" />
                            )}
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="path"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addDomainPath')}</FormLabel>
                            <FormControl>
                                <RefAware value={field.value} onChange={field.onChange}>
                                    <Input
                                        {...field}
                                        placeholder={t('pathPlaceholder')}
                                        className="font-mono"
                                    />
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="internalPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('addDomainInternalPath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    placeholder={t('pathPlaceholder')}
                                    className="font-mono"
                                />
                            </RefAware>
                        </FormControl>
                        <FormDescription>{tDomains('internalPathDescription')}</FormDescription>
                    </FormItem>
                )}
            />
            <div className="grid items-start gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="containerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{tDomains('container')}</FormLabel>
                            <FormControl>
                                <RefAware value={field.value} onChange={field.onChange}>
                                    <InputAutoComplete
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        options={containerOptions}
                                        heading={tDomains('container')}
                                        placeholder={tDomains('containerNamePlaceholder')}
                                    />
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                            {environment && <FormDescription>{environment.name}</FormDescription>}
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="containerPort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addDomainContainerPort')}</FormLabel>
                            <FormControl>
                                <RefAware value={field.value} onChange={field.onChange}>
                                    <Input
                                        {...field}
                                        type="number"
                                        placeholder={t('portNumberPlaceholder')}
                                    />
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                <FormField
                    control={form.control}
                    name="stripPath"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <RefAware
                                    value={field.value}
                                    onChange={field.onChange}
                                    emptyValue={false}
                                >
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </RefAware>
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">
                                    {t('addDomainStripPath')}
                                </FormLabel>
                                <FormDescription>
                                    {tDomains('stripPathDescription')}
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="https"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <RefAware
                                    value={field.value}
                                    onChange={field.onChange}
                                    emptyValue={false}
                                >
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (!checked) {
                                                form.setValue('certificateId', undefined);
                                            }
                                        }}
                                    />
                                </RefAware>
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">
                                    {t('addDomainHttps')}
                                </FormLabel>
                                <FormDescription>{tDomains('httpsDescription')}</FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
            {httpsEnabled && (
                <FormField
                    control={form.control}
                    name="certificateId"
                    render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>{tDomains('certificate')}</FormLabel>
                            <FormControl>
                                <RefAware
                                    value={field.value}
                                    onChange={field.onChange}
                                    emptyValue={undefined}
                                >
                                    <Select
                                        value={field.value ?? ''}
                                        onValueChange={(val) => field.onChange(val || undefined)}
                                    >
                                        <SelectTrigger className={'w-full'}>
                                            <SelectValue
                                                placeholder={tDomains('selectCertificate')}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {certificates.length === 0 ? (
                                                <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                                                    {tDomains('noCertificates')}
                                                </div>
                                            ) : (
                                                certificates.map((cert) => (
                                                    <SelectItem key={cert.id} value={cert.id}>
                                                        <span className="flex items-center gap-2">
                                                            <ShieldCheck className="text-primary" />
                                                            <span>{cert.name}</span>
                                                            <span className="text-muted-foreground font-mono text-xs">
                                                                {cert.domain}
                                                            </span>
                                                        </span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </RefAware>
                            </FormControl>
                            {fieldState.error && (
                                <p className="text-destructive text-xs">
                                    {t(fieldState.error.message as string)}
                                </p>
                            )}
                            <FormDescription>{t('certificateDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
}
