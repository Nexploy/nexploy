import type { UseFormReturn } from 'react-hook-form';
import { DomainFormInput, DomainFormOutput } from '@workspace/schemas-zod/repository/domain.schema';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { CloudflareDomainSelector } from '@/components/domains/CloudflareDomainSelector';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useEnvironmentContainers } from '@/hooks/sse/useEnvironmentContainers';
import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import type { CertOption } from '@workspace/typescript-interface/traefik/certificate';

interface DomainFieldsProps {
    form: UseFormReturn<DomainFormInput, unknown, DomainFormOutput>;
}

export function DomainFields({ form }: DomainFieldsProps) {
    const t = useTranslations('repository.settings.domains');
    const cloudflareZoneId = form.watch('domain.cloudflareZoneId');
    const httpsEnabled = form.watch('domain.https');

    const { data: certificates = [] } = useSWR<CertOption[]>(
        httpsEnabled ? { url: '/api/ssl-certificates' } : null,
        fetcherApi,
    );
    const selectedContainerName = form.watch('domain.containerName');
    const environmentId = form.watch('domain.environmentId');

    const environments = useEnvironmentStore((s) => s.environments);

    const { containers } = useEnvironmentContainers(environmentId);

    const selectedContainer = containers.find((c) => c.name === selectedContainerName);

    const portOptions = selectedContainer?.ports.map((p) => p.privatePort);

    const handleContainerChange = (name: string) => {
        form.setValue('domain.containerName', name);

        const container = containers.find((c) => c.name === name);
        const internalPort = container?.ports[0]?.privatePort;

        if (internalPort) {
            form.setValue('domain.containerPort', internalPort);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <FormField
                control={form.control}
                name="domain.environmentId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('environment')}</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectEnvironment')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('environment')}</SelectLabel>
                                    {environments.map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        <FormDescription>{t('environmentDescription')}</FormDescription>
                    </FormItem>
                )}
            />
            <CloudflareDomainSelector form={form} basePath="domain" />
            <div className="grid items-start gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="domain.host"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('host')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value}
                                    placeholder="example.com"
                                    className="font-mono"
                                    readOnly={!!cloudflareZoneId}
                                    disabled={!!cloudflareZoneId}
                                />
                            </FormControl>
                            {cloudflareZoneId ? (
                                <FormDescription>{t('managedByCloudflare')}</FormDescription>
                            ) : (
                                <FormMessage />
                            )}
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="domain.path"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('path')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value as string}
                                    placeholder="/"
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
                name="domain.internalPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('internalPath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value}
                                placeholder="/"
                                className="font-mono"
                            />
                        </FormControl>
                        <FormDescription>{t('internalPathDescription')}</FormDescription>
                    </FormItem>
                )}
            />

            <div className="grid items-start gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="domain.containerName"
                    render={() => (
                        <FormItem>
                            <FormLabel>{t('container')}</FormLabel>
                            <Select
                                value={selectedContainerName ?? ''}
                                onValueChange={handleContainerChange}
                            >
                                <FormControl>
                                    <SelectTrigger
                                        className={'w-full !pl-0 data-[placeholder]:!pl-3'}
                                    >
                                        <SelectValue placeholder={t('selectContainer')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {containers.length === 0 ? (
                                        <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                                            {t('noContainers')}
                                        </div>
                                    ) : (
                                        <SelectGroup>
                                            <SelectLabel>{t('container')}</SelectLabel>
                                            {containers.map((container) => (
                                                <SelectItem
                                                    key={container.id}
                                                    value={container.name}
                                                    className="pl-0"
                                                >
                                                    <Status
                                                        className="m-0 w-full rounded-none border-0 p-0 pl-2.5 text-sm"
                                                        status={
                                                            container.state === 'running'
                                                                ? 'online'
                                                                : 'offline'
                                                        }
                                                        variant="outline"
                                                    >
                                                        <StatusIndicator />
                                                        <span className="truncate">
                                                            {container.name}
                                                        </span>
                                                    </Status>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            <FormDescription>{t('containerDescription')}</FormDescription>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="domain.containerPort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('containerPort')}</FormLabel>
                            <Select
                                value={field.value ? `${field.value}` : ''}
                                onValueChange={(val) => {
                                    if (val) field.onChange(parseInt(val, 10));
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger className={'w-full'}>
                                        <SelectValue placeholder={t('selectPort')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {!portOptions?.length ? (
                                        <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                                            {t('noPorts')}
                                        </div>
                                    ) : (
                                        <SelectGroup>
                                            <SelectLabel>{t('containerPort')}</SelectLabel>
                                            {portOptions?.map((port) => (
                                                <SelectItem key={port} value={`${port}`}>
                                                    <span className="font-mono">{port}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription>{t('containerPortDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                <FormField
                    control={form.control}
                    name="domain.stripPath"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">{t('stripPath')}</FormLabel>
                                <FormDescription>{t('stripPathDescription')}</FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="domain.https"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                            <FormControl>
                                <Switch
                                    checked={field.value as boolean}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if (!checked) {
                                            form.setValue('domain.certificateId', undefined);
                                        }
                                    }}
                                />
                            </FormControl>
                            <div>
                                <FormLabel className="cursor-pointer">{t('https')}</FormLabel>
                                <FormDescription>{t('httpsDescription')}</FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
            </div>

            {httpsEnabled && (
                <FormField
                    control={form.control}
                    name="domain.certificateId"
                    render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>{t('certificate')}</FormLabel>
                            <Select
                                value={field.value ?? ''}
                                onValueChange={(val) => field.onChange(val || undefined)}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectCertificate')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {certificates.length === 0 ? (
                                        <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                                            {t('noCertificates')}
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
                            {fieldState.error ? (
                                <p className="text-destructive text-sm font-medium">
                                    {t(fieldState.error.message as string)}
                                </p>
                            ) : (
                                <FormDescription>{t('certificateDescription')}</FormDescription>
                            )}
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
}
