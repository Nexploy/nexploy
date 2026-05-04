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
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function DeleteImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { images, isLoading } = useEnvironmentImages();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="imageId"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        !isNodeFieldRef(field.value) &&
                        !images.find((img) => img.id === field.value);

                    return (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('imageId')}</FormLabel>
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
                                            <SelectTrigger className="max-w-full overflow-hidden !pl-0 data-[placeholder]:!pl-3">
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
                                                    {images.length === 0 ? (
                                                        <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                            {t('noImagesAvailable')}
                                                        </span>
                                                    ) : (
                                                        images.map((img) => (
                                                            <SelectItem
                                                                key={img.id}
                                                                value={img.id}
                                                                className="pl-0"
                                                            >
                                                                <Status
                                                                    className="m-0 w-full rounded-none border-0 p-0 pl-2.5 text-sm"
                                                                    status={
                                                                        img.containersUsed
                                                                            ? 'online'
                                                                            : 'offline'
                                                                    }
                                                                    variant="outline"
                                                                >
                                                                    <StatusIndicator className="pl-2" />
                                                                    <span className="truncate">
                                                                        {img.repoTags.join(', ')}
                                                                    </span>
                                                                </Status>
                                                            </SelectItem>
                                                        ))
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
                name="force"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('force')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
