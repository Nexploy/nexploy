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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { findAncestor } from '@/inngest/pipeline/utils/graphQueries';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { useMemo } from 'react';

export function CreateContainerConfig() {
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
        return ancestor?.data.config?.environmentId ?? null;
    }, []);

    const { images, isLoading } = useEnvironmentImages(environmentId);

    const imageOptions = useMemo(() => {
        const tags = new Set<string>();
        for (const img of images) {
            for (const repoTag of img.repoTags ?? []) {
                if (repoTag !== '<none>:<none>') tags.add(repoTag);
            }
        }
        return Array.from(tags)
            .sort()
            .map((tag) => ({ value: tag, label: tag }));
    }, [images]);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="containerName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerName')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('createContainerNamePlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="imageName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerImage')}</FormLabel>
                        <FormControl>
                            <InputAutoComplete
                                className="truncate"
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                options={imageOptions}
                                isLoading={isLoading}
                                placeholder={t('createContainerImagePlaceholder')}
                                heading={t('availableImages')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="restartPolicy"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerRestartPolicy')}</FormLabel>
                        <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>
                                            {t('createContainerRestartPolicy')}
                                        </SelectLabel>
                                        <SelectItem value="unless-stopped">
                                            unless-stopped
                                        </SelectItem>
                                        <SelectItem value="always">always</SelectItem>
                                        <SelectItem value="on-failure">on-failure</SelectItem>
                                        <SelectItem value="no">no</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="networkName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerNetwork')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('createContainerNetworkPlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
