'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { AlertTriangle } from 'lucide-react';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware.tsx';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';

export function ScaleServiceConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const services = useSwarmStore((state) => state.services);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => {
                    const isStale =
                        !!field.value &&
                        services.length > 0 &&
                        !services.find((s) => s.id === field.value);

                    const handleSelect = (serviceId: string) => {
                        field.onChange(serviceId);
                        const service = services.find((s) => s.id === serviceId);
                        if (service) form.setValue('serviceName', service.name);
                    };

                    return (
                        <FormItem>
                            <FormLabel>{t('serviceName')}</FormLabel>
                            <FormControl>
                                <RefAware value={field.value} onChange={field.onChange}>
                                    <Select onValueChange={handleSelect} value={field.value}>
                                        <SelectTrigger className="w-full overflow-hidden data-[placeholder]:!pl-3">
                                            {isStale ? (
                                                <span className="flex items-center gap-1.5 pl-3">
                                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                                    {t('serviceUnavailable')}
                                                </span>
                                            ) : (
                                                <SelectValue
                                                    placeholder={t('serviceNamePlaceholder')}
                                                />
                                            )}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    {t('servicesSelectLabel')}
                                                </SelectLabel>
                                                {services.length === 0 ? (
                                                    <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                        {t('noServicesFound')}
                                                    </span>
                                                ) : (
                                                    services.map((service) => (
                                                        <SelectItem
                                                            key={service.id}
                                                            value={service.id}
                                                        >
                                                            {service.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="replicas"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('serviceReplicas')}</FormLabel>
                        <FormControl>
                            <Input {...field} type="number" min={1} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
