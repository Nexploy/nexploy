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
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { useMemo } from 'react';

export function ScanImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { images, isLoading } = useEnvironmentImages();

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
            <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem className="min-w-0 flex-1">
                            <FormLabel>{t('scanImage')}</FormLabel>
                            <FormControl>
                                <InputAutoComplete
                                    {...field}
                                    className={'truncate'}
                                    options={imageOptions}
                                    isLoading={isLoading}
                                    placeholder={t('scanImagePlaceholder')}
                                    heading={t('availableImages')}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="trivyVersion"
                    render={({ field }) => (
                        <FormItem className="w-28 shrink-0 self-start">
                            <FormLabel>{t('trivyVersion')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="canary" />
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
