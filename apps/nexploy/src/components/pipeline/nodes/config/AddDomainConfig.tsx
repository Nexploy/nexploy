'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
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
import { ShieldCheck } from 'lucide-react';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';

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

    const { data: certificates = [] } = useSWR<CertOption[]>(
        httpsEnabled ? { url: '/api/ssl-certificates' } : null,
        fetcherApi,
    );

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('addDomainHost')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={t('domainPlaceholder')}
                                className="font-mono"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
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
                            <Input
                                {...field}
                                type="number"
                                placeholder={t('portNumberPlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="path"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addDomainPath')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={t('pathPlaceholder')}
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="internalPath"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addDomainInternalPath')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={t('pathPlaceholder')}
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="https"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (!checked) {
                                        form.setValue('certificateId', undefined);
                                    }
                                }}
                            />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">
                            {t('addDomainHttps')}
                        </FormLabel>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="stripPath"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">
                            {t('addDomainStripPath')}
                        </FormLabel>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            {httpsEnabled && (
                <FormField
                    control={form.control}
                    name="certificateId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{tDomains('certificate')}</FormLabel>
                            <Select
                                value={field.value ?? ''}
                                onValueChange={(val) => field.onChange(val || undefined)}
                            >
                                <FormControl>
                                    <SelectTrigger className={'w-full'}>
                                        <SelectValue placeholder={tDomains('selectCertificate')} />
                                    </SelectTrigger>
                                </FormControl>
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
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
}
