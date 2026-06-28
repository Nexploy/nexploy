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
import { Input } from '@workspace/ui/components/input';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';
import { useMemo } from 'react';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function TagImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

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
                name="sourceImage"
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
                            <FormLabel>{t('sourceImage')}</FormLabel>
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
                name="targetTag"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('targetTag')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={t('versionTagPlaceholder')}
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
