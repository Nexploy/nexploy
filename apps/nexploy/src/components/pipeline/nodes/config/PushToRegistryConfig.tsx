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
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { RegistryInfo } from '@/services/registry.service';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware.tsx';
import { InputAutoComplete } from '@workspace/ui/components/search-command.tsx';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages.ts';
import { useMemo } from 'react';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function PushToRegistryConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { data: registries, isLoading } = useSWR<RegistryInfo[]>(
        { url: '/api/registries' },
        fetcherApi,
    );
    const registryList = registries ?? [];

    const environmentId = usePipelineEnvironmentId();
    const { images, isLoading: imagesLoading } = useEnvironmentImages(environmentId);

    const imageOptions = useMemo(() => {
        const names = new Set<string>();
        for (const img of images) {
            for (const repoTag of img.repoTags ?? []) {
                if (repoTag === '<none>:<none>') continue;
                names.add(repoTag);
            }
        }
        return Array.from(names)
            .sort()
            .map((name) => ({ value: name, label: name }));
    }, [images]);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="imageName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('imageName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <InputAutoComplete
                                    {...field}
                                    options={imageOptions}
                                    isLoading={imagesLoading}
                                    heading={t('availableImages')}
                                    autoComplete="off"
                                    placeholder={t('imageNamePlaceholder')}
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="registryId"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        registryList.length >= 0 &&
                        !registryList.find((r) => r.id === field.value);

                    return (
                        <FormItem>
                            <FormLabel>{t('registry')}</FormLabel>
                            <FormControl>
                                <Select
                                    {...field}
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const registry = registryList.find((r) => r.id === value)!;
                                        form.setValue('registryName', registry.name);
                                    }}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger
                                        className={
                                            'min-w-40 overflow-hidden data-[placeholder]:pl-3!'
                                        }
                                    >
                                        {isLoading ? (
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t('registriesLoading')}
                                            </span>
                                        ) : isStale ? (
                                            <span className="flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                {t('registryUnavailable')}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder={t('registryPlaceholder')} />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('registry')}</SelectLabel>
                                            {registryList.length === 0 ? (
                                                <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                    {t('noRegistry')}
                                                </span>
                                            ) : (
                                                registryList.map((registry) => (
                                                    <SelectItem
                                                        key={registry.id}
                                                        value={registry.id}
                                                    >
                                                        {registry.name} ({registry.url})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />
        </div>
    );
}
