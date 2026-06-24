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
import type {
    CloudflareAccountInfo,
    CloudflareZone,
} from '@workspace/typescript-interface/cloudflare/cloudflare';
import { Cloud, Loader2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useTranslations } from 'next-intl';

interface CloudflareDomainSelectorProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    basePath?: string;
}

export function CloudflareDomainSelector<T extends FieldValues>({
    form,
    basePath,
}: CloudflareDomainSelectorProps<T>) {
    const t = useTranslations('repository.settings.cloudflare');

    const { data: cloudflareAccounts = [] } = useSWR<CloudflareAccountInfo[]>(
        { url: '/api/cloudflare/accounts' },
        fetcherApi,
    );

    const fieldPath = (field: string) => (basePath ? `${basePath}.${field}` : field) as Path<T>;

    const selectedCredentialId = form.watch(fieldPath('cloudflareCredentialId')) as
        | string
        | undefined;
    const selectedZoneId = form.watch(fieldPath('cloudflareZoneId')) as string | undefined;
    const selectedZoneName = form.watch(fieldPath('cloudflareZoneName')) as string | undefined;
    const currentHost = form.watch(fieldPath('host')) as string | undefined;

    const { data: zones, isLoading: isLoadingZones } = useSWR<CloudflareZone[]>(
        selectedCredentialId
            ? { url: `/api/cloudflare/zone?credentialId=${selectedCredentialId}` }
            : null,
        fetcherApi,
    );

    const selectedZone = zones?.find((z) => z.id === selectedZoneId);
    const displayZoneName = selectedZone?.name || selectedZoneName;
    const isOrphanedZone = selectedZoneId && !selectedZone && selectedZoneName;

    const subdomain =
        currentHost && displayZoneName
            ? currentHost.replace(`.${displayZoneName}`, '').replace(displayZoneName, '')
            : '';

    const handleAccountChange = (credentialId: string) => {
        form.setValue(fieldPath('cloudflareCredentialId'), credentialId as never, {
            shouldDirty: true,
        });
        form.setValue(fieldPath('cloudflareZoneId'), undefined as never, {
            shouldDirty: true,
        });
        form.setValue(fieldPath('cloudflareZoneName'), undefined as never, {
            shouldDirty: true,
        });
    };

    const handleZoneChange = (zoneId: string) => {
        if (zoneId === 'manual') {
            form.setValue(fieldPath('cloudflareZoneId'), undefined as never, {
                shouldDirty: true,
            });
            form.setValue(fieldPath('cloudflareZoneName'), undefined as never, {
                shouldDirty: true,
            });
        } else {
            const zone = zones?.find((z) => z.id === zoneId);
            if (zone) {
                form.setValue(fieldPath('cloudflareZoneId'), zoneId as never, {
                    shouldDirty: true,
                });
                form.setValue(fieldPath('cloudflareZoneName'), zone.name as never, {
                    shouldDirty: true,
                });
                if (!currentHost || !currentHost.includes(zone.name)) {
                    form.setValue(fieldPath('host'), zone.name as never, {
                        shouldDirty: true,
                    });
                }
            }
        }
    };

    const handleSubdomainChange = (value: string) => {
        const zoneName = selectedZone?.name || selectedZoneName;
        if (zoneName) {
            const cleanValue = value.trim();
            const host = cleanValue ? `${cleanValue}.${zoneName}` : zoneName;
            form.setValue(fieldPath('host'), host as never, { shouldDirty: true });
        }
    };

    if (cloudflareAccounts.length === 0) {
        return null;
    }

    return (
        <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <Cloud className="size-4 text-orange-500" />
                <span className="text-sm font-medium">{t('title')}</span>
                <Badge variant="secondary" className="text-xs">
                    {t('automaticDns')}
                </Badge>
            </div>

            <div className="space-y-2">
                <FormLabel>{t('account')}</FormLabel>
                <Select onValueChange={handleAccountChange} value={selectedCredentialId || ''}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>{t('selectAccount')}</SelectLabel>
                            {cloudflareAccounts.map((account) => (
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
                            <Select
                                onValueChange={handleZoneChange}
                                value={selectedZoneId || 'manual'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectZone')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('zone')}</SelectLabel>
                                        <SelectItem value="manual">
                                            <span className="text-muted-foreground">
                                                {t('manualEntry')}
                                            </span>
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
