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
import { Switch } from '@workspace/ui/components/switch';
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
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

export function ScanImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const environmentId = usePipelineEnvironmentId();
    const { images, isLoading } = useEnvironmentImages(environmentId);

    const imageOptions = useMemo(() => {
        const seen = new Set<string>();
        const entries: { tag: string; containersUsed: boolean }[] = [];
        for (const img of images) {
            for (const tag of img.repoTags ?? []) {
                if (tag !== '<none>:<none>' && !seen.has(tag)) {
                    seen.add(tag);
                    entries.push({ tag, containersUsed: !!img.containersUsed });
                }
            }
        }
        return entries.sort((a, b) => a.tag.localeCompare(b.tag));
    }, [images]);

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => {
                        const isStale =
                            !isLoading &&
                            !!field.value &&
                            !imageOptions.find((imageOption) => imageOption.tag === field.value);

                        return (
                            <FormItem className="min-w-0 flex-1">
                                <FormLabel>{t('scanImage')}</FormLabel>
                                <FormControl>
                                    {isLoading ? (
                                        <p className="text-muted-foreground bg-input/30 border-input flex h-9 items-center gap-1 rounded-md border px-3 py-2 text-sm">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            {t('imagesLoading')}
                                        </p>
                                    ) : (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="w-full overflow-hidden !pl-0 data-[placeholder]:!pl-3">
                                                {isStale ? (
                                                    <span className="flex items-center gap-1.5 pl-3">
                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                        {t('imageUnavailable')}
                                                    </span>
                                                ) : (
                                                    <SelectValue
                                                        placeholder={t('scanImagePlaceholder')}
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
                                                            ({ tag, containersUsed }) => (
                                                                <SelectItem
                                                                    key={tag}
                                                                    value={tag}
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
                                                                            {tag}
                                                                        </span>
                                                                    </Status>
                                                                </SelectItem>
                                                            ),
                                                        )
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        );
                    }}
                />
                <FormField
                    control={form.control}
                    name="trivyVersion"
                    render={({ field }) => (
                        <FormItem className="w-28 shrink-0 self-start">
                            <FormLabel>{t('trivyVersion')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('trivyVersionPlaceholder')} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('scanSeverity')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('scanSeverity')}</SelectLabel>
                                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                                    <SelectItem value="HIGH">HIGH</SelectItem>
                                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                                    <SelectItem value="LOW">LOW</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="exitOnVulnerabilities"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel className="cursor-pointer">
                            {t('exitOnVulnerabilities')}
                        </FormLabel>
                        <FormControl>
                            <Switch
                                className="cursor-pointer"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
