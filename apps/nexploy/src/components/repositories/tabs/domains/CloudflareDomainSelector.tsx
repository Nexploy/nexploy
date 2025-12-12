'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { FormDescription, FormItem, FormLabel } from '@workspace/ui/components/form';
import { CloudflareZone } from '@workspace/typescript-interface/cloudflare/cloudflare';
import { Cloud, Loader2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';

interface CloudflareDomainSelectorProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    index: number;
    isCloudflareConnected: boolean;
}

export function CloudflareDomainSelector<T extends FieldValues>({
    form,
    index,
    isCloudflareConnected,
}: CloudflareDomainSelectorProps<T>) {
    const { data: zones, isLoading } = useSWR<CloudflareZone[]>(
        isCloudflareConnected ? '/api/cloudflare/zone' : null,
        fetcherApi,
    );

    const selectedZoneId = form.watch(`domains.${index}.cloudflareZoneId` as Path<T>) as
        | string
        | undefined;
    const selectedZoneName = form.watch(`domains.${index}.cloudflareZoneName` as Path<T>) as
        | string
        | undefined;
    const currentHost = form.watch(`domains.${index}.host` as Path<T>) as string | undefined;

    const selectedZone = zones?.find((z) => z.id === selectedZoneId);
    const displayZoneName = selectedZone?.name || selectedZoneName;

    const isOrphanedZone = selectedZoneId && !selectedZone && selectedZoneName;

    const subdomain =
        currentHost && displayZoneName
            ? currentHost.replace(`.${displayZoneName}`, '').replace(displayZoneName, '')
            : '';

    const handleZoneChange = (zoneId: string) => {
        if (zoneId === 'manual') {
            form.setValue(`domains.${index}.cloudflareZoneId` as Path<T>, undefined as never, {
                shouldDirty: true,
            });
            form.setValue(`domains.${index}.cloudflareZoneName` as Path<T>, undefined as never, {
                shouldDirty: true,
            });
        } else {
            const zone = zones?.find((z) => z.id === zoneId);
            if (zone) {
                form.setValue(`domains.${index}.cloudflareZoneId` as Path<T>, zoneId as never, {
                    shouldDirty: true,
                });
                form.setValue(
                    `domains.${index}.cloudflareZoneName` as Path<T>,
                    zone.name as never,
                    { shouldDirty: true },
                );
                if (!currentHost || !currentHost.includes(zone.name)) {
                    form.setValue(`domains.${index}.host` as Path<T>, zone.name as never, {
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
            form.setValue(`domains.${index}.host` as Path<T>, host as never, { shouldDirty: true });
        }
    };

    if (!isCloudflareConnected) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="bg-muted/50 flex items-center gap-2 rounded-lg border border-dashed p-3">
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
                <span className="text-muted-foreground text-sm">
                    Chargement des zones Cloudflare...
                </span>
            </div>
        );
    }

    return (
        <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <Cloud className="size-4 text-orange-500" />
                <span className="text-sm font-medium">Configuration Cloudflare</span>
                <Badge variant="secondary" className="text-xs">
                    DNS automatique
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <FormLabel>Zone Cloudflare</FormLabel>
                    <Select onValueChange={handleZoneChange} value={selectedZoneId || 'manual'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une zone" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="manual">
                                <span className="text-muted-foreground">Saisie manuelle</span>
                            </SelectItem>
                            {isOrphanedZone && (
                                <SelectItem value={selectedZoneId}>
                                    <span className="text-muted-foreground">
                                        {selectedZoneName} (zone non trouvée)
                                    </span>
                                </SelectItem>
                            )}
                            {zones?.map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                    {zone.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        {isOrphanedZone
                            ? "La zone d'origine n'est plus disponible. Sélectionnez une autre zone ou passez en saisie manuelle."
                            : 'Sélectionnez une zone pour créer automatiquement le DNS'}
                    </FormDescription>
                </div>

                {(selectedZoneId || selectedZoneName) && (
                    <FormItem>
                        <FormLabel>Sous-domaine</FormLabel>
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
                        <FormDescription>Laissez vide pour le domaine racine</FormDescription>
                    </FormItem>
                )}
            </div>
        </div>
    );
}
