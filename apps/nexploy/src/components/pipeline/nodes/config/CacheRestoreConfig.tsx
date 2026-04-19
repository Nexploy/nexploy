'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware.tsx';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { findAncestor } from '@/inngest/pipeline/utils/graphQueries';
import { useEnvironmentVolumes } from '@/hooks/sse/useEnvironmentVolumes';

export function CacheRestoreConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { nodes, edges } = usePipelineContext();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    const environmentId = useMemo(() => {
        if (!panelNodeId) return null;
        const ancestor = findAncestor(
            panelNodeId,
            nodes,
            edges,
            (data) => data.nodeType === 'set-environment' && !data.disabled,
        );
        return ancestor?.data.config?.environmentId;
    }, []);

    const { volumes, isLoading } = useEnvironmentVolumes(environmentId);
    const volumeOptions = volumes.map((v) => ({ value: v.name, label: v.name }));

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="volumeName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cacheVolumeName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <InputAutoComplete
                                    {...field}
                                    options={volumeOptions}
                                    isLoading={isLoading}
                                    placeholder="build-cache"
                                    heading={t('volumesSelectLabel')}
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="cachePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cachePath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder="node_modules" />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="cacheKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cacheKey')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('cacheKeyPlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
