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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { useMemo } from 'react';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function UpdateServiceConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const services = useSwarmStore((state) => state.services);

    const environmentId = usePipelineEnvironmentId();
    const { images, isLoading } = useEnvironmentImages(environmentId);

    const imageOptions = useMemo(() => {
        const seen = new Set<string>();
        const entries: { value: string; repoTags: string[]; containersUsed: boolean }[] = [];
        for (const img of images) {
            const value = img.repoTags.find((t) => !t.startsWith('<none>')) ?? img.id;
            if (!seen.has(value)) {
                seen.add(value);
                entries.push({
                    value,
                    repoTags: img.repoTags,
                    containersUsed: !!img.containersUsed,
                });
            }
        }
        return entries;
    }, [images]);

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
                                        <SelectTrigger className="w-full overflow-hidden data-[placeholder]:pl-3!">
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
                name="image"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        !isNodeFieldRef(field.value) &&
                        !imageOptions.find(
                            (imageOption) =>
                                imageOption.value === field.value ||
                                imageOption.repoTags.includes(field.value),
                        );

                    return (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('serviceImage')}</FormLabel>
                            <FormControl>
                                {isLoading ? (
                                    <p className="text-muted-foreground bg-input/30 border-input flex h-9 items-center gap-1 rounded-md border px-3 py-2 text-sm">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {t('imagesLoading')}
                                    </p>
                                ) : (
                                    <RefAware value={field.value} onChange={field.onChange}>
                                        <Select
                                            {...field}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="w-full overflow-hidden pl-0! data-[placeholder]:pl-3!">
                                                {isStale ? (
                                                    <span className="flex items-center gap-1.5 pl-3">
                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                        {t('imageUnavailable')}
                                                    </span>
                                                ) : (
                                                    <SelectValue
                                                        placeholder={t('imageIdPlaceholder')}
                                                    />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>
                                                        {t('imagesSelectLabel')}
                                                    </SelectLabel>
                                                    {imageOptions.length === 0 ? (
                                                        <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                            {t('noImagesAvailable')}
                                                        </span>
                                                    ) : (
                                                        imageOptions.map(
                                                            ({
                                                                value,
                                                                repoTags,
                                                                containersUsed,
                                                            }) => (
                                                                <SelectItem
                                                                    key={value}
                                                                    value={value}
                                                                    className="pl-0"
                                                                >
                                                                    <Status
                                                                        className="m-0 w-full rounded-none border-0 p-0 pl-2.5 text-sm"
                                                                        status={
                                                                            containersUsed
                                                                                ? 'online'
                                                                                : 'offline'
                                                                        }
                                                                        variant="outline"
                                                                    >
                                                                        <StatusIndicator className="pl-2" />
                                                                        <span className="truncate">
                                                                            {repoTags.join(', ')}
                                                                        </span>
                                                                    </Status>
                                                                </SelectItem>
                                                            ),
                                                        )
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </RefAware>
                                )}
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="forceUpdate"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('serviceForceUpdate')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
