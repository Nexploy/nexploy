'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { FormDescription, FormItem, FormLabel } from '@workspace/ui/components/form';
import type { DnsAccountInfo, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { dnsProviderDescriptors } from '@workspace/schemas-zod/dns/dns.schema';
import { Globe, Loader2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useTranslations } from 'next-intl';

interface DnsDomainSelectorProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    basePath?: string;
}

export function DnsDomainSelector<T extends FieldValues>({ form, basePath }: DnsDomainSelectorProps<T>) {
    const t = useTranslations('repository.settings.dns');

    const { data: dnsAccounts = [] } = useSWR<DnsAccountInfo[]>({ url: '/api/dns/accounts' }, fetcherApi);

    const fieldPath = (field: string) => (basePath ? `${basePath}.${field}` : field) as Path<T>;

    const selectedCredentialId = form.watch(fieldPath('dnsCredentialId')) as string | undefined;
    const selectedZoneId = form.watch(fieldPath('dnsZoneId')) as string | undefined;
    const selectedZoneName = form.watch(fieldPath('dnsZoneName')) as string | undefined;
    const currentHost = form.watch(fieldPath('host')) as string | undefined;

    const { data: zones, isLoading: isLoadingZones } = useSWR<DnsZone[]>(
        selectedCredentialId ? { url: `/api/dns/zones?credentialId=${selectedCredentialId}` } : null,
        fetcherApi,
    );

    const selectedAccount = dnsAccounts.find((account) => account.id === selectedCredentialId);
    const selectedDescriptor = selectedAccount ? dnsProviderDescriptors[selectedAccount.provider] : undefined;
    const capabilities = selectedDescriptor?.capabilities;

    const selectedZone = zones?.find((z) => z.id === selectedZoneId);
    const displayZoneName = selectedZone?.name || selectedZoneName;
    const isOrphanedZone = selectedZoneId && !selectedZone && selectedZoneName;

    const subdomain =
        currentHost && displayZoneName
            ? currentHost.replace(`.${displayZoneName}`, '').replace(displayZoneName, '')
            : '';

    const setDnsValue = (field: 'CredentialId' | 'ZoneId' | 'ZoneName', value: string | undefined) => {
        form.setValue(fieldPath(`dns${field}`), value as never, { shouldDirty: true });
    };

    const handleAccountChange = (credentialId: string) => {
        setDnsValue('CredentialId', credentialId);
        setDnsValue('ZoneId', undefined);
        setDnsValue('ZoneName', undefined);
    };

    const handleZoneChange = (zoneId: string) => {
        if (zoneId === 'manual') {
            setDnsValue('ZoneId', undefined);
            setDnsValue('ZoneName', undefined);
            return;
        }

        const zone = zones?.find((z) => z.id === zoneId);
        if (!zone) return;

        setDnsValue('ZoneId', zoneId);
        setDnsValue('ZoneName', zone.name);
        if (!currentHost || !currentHost.includes(zone.name)) {
            form.setValue(fieldPath('host'), zone.name as never, { shouldDirty: true });
        }
    };

    const handleSubdomainChange = (value: string) => {
        const zoneName = selectedZone?.name || selectedZoneName;
        if (!zoneName) return;

        const cleanValue = value.trim();
        const host = cleanValue ? `${cleanValue}.${zoneName}` : zoneName;
        form.setValue(fieldPath('host'), host as never, { shouldDirty: true });
    };

    if (dnsAccounts.length === 0) {
        return null;
    }

    return (
        <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <Globe className="size-4 text-orange-500" />
                <span className="text-sm font-medium">{t('title')}</span>
                <Badge variant="secondary" className="text-xs">
                    {t('automaticDns')}
                </Badge>
                {capabilities?.supportsProxy && (
                    <Badge variant="outline" className="text-xs">
                        {t('proxied')}
                    </Badge>
                )}
                {selectedDescriptor?.experimental && (
                    <Badge variant="warning" className="text-xs">
                        {t('experimental')}
                    </Badge>
                )}
            </div>

            <div className="space-y-2">
                <FormLabel>{t('account')}</FormLabel>
                <Select onValueChange={handleAccountChange} value={selectedCredentialId || ''}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('selectAccount')} />
                    </SelectTrigger>
                    <SelectContent align="start">
                        <SelectGroup>
                            <SelectLabel>{t('selectAccount')}</SelectLabel>
                            {dnsAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.displayName}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {selectedCredentialId &&
                (isLoadingZones ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="text-muted-foreground size-4 animate-spin" />
                        <span className="text-muted-foreground text-sm">{t('loading')}</span>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <FormLabel>{t('zone')}</FormLabel>
                            <Select onValueChange={handleZoneChange} value={selectedZoneId || 'manual'}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectZone')} />
                                </SelectTrigger>
                                <SelectContent align="start">
                                    <SelectGroup>
                                        <SelectLabel>{t('zone')}</SelectLabel>
                                        <SelectItem value="manual">
                                            <span className="text-muted-foreground">{t('manualEntry')}</span>
                                        </SelectItem>
                                        <SelectSeparator />
                                        {isOrphanedZone && (
                                            <SelectItem value={selectedZoneId}>
                                                <span className="text-muted-foreground">
                                                    {selectedZoneName} ({t('zoneNotFound')})
                                                </span>
                                            </SelectItem>
                                        )}
                                        {zones?.map((zone) => (
                                            <SelectItem key={zone.id} value={zone.id}>
                                                {zone.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {isOrphanedZone ? t('zoneUnavailable') : t('selectZoneForDns')}
                            </FormDescription>
                        </div>

                        {(selectedZoneId || selectedZoneName) && (
                            <FormItem>
                                <FormLabel>{t('subdomain')}</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="app"
                                        className="font-mono"
                                        value={subdomain}
                                        onChange={(e) => handleSubdomainChange(e.target.value)}
                                    />
                                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                                        .{displayZoneName}
                                    </span>
                                </div>
                                <FormDescription>{t('emptyForRoot')}</FormDescription>
                            </FormItem>
                        )}
                    </div>
                ))}
        </div>
    );
}
