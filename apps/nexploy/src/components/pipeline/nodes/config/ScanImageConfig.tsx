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
import { useImageStore } from '@/stores/docker/useImageStore';
import { useEffect, useMemo } from 'react';

export function ScanImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const images = useImageStore((state) => state.images);

    const selectedImage = form.watch('image');

    const imageNames = useMemo(() => {
        const names = new Set<string>();
        for (const img of images) {
            for (const repoTag of img.repoTags ?? []) {
                if (repoTag === '<none>:<none>') continue;
                const name = repoTag.split(':')[0];
                if (name) names.add(name);
            }
        }
        return Array.from(names).sort();
    }, [images]);

    const availableTags = useMemo(() => {
        if (!selectedImage) return [];
        const tags = new Set<string>();
        for (const img of images) {
            for (const repoTag of img.repoTags ?? []) {
                if (repoTag.startsWith(`${selectedImage}:`)) {
                    const tag = repoTag.slice(selectedImage.length + 1);
                    if (tag) tags.add(tag);
                }
            }
        }
        return Array.from(tags).sort();
    }, [images, selectedImage]);

    useEffect(() => {
        if (availableTags.length === 0) return;
        const currentTag = form.getValues('tag');
        if (!availableTags.includes(currentTag)) {
            form.setValue('tag', availableTags[0], { shouldDirty: true });
        }
    }, [availableTags]);

    return (
        <div className="space-y-4">
            <div className={'flex flex-1 gap-2'}>
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem className={'min-w-0 flex-1'}>
                            <FormLabel>{t('scanImage')}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger className="w-full overflow-hidden">
                                        <SelectValue
                                            className={'truncate'}
                                            placeholder={t('scanImagePlaceholder')}
                                        />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('scanImage')}</SelectLabel>
                                        {imageNames.length === 0 ? (
                                            <SelectItem value="__empty__" disabled>
                                                {t('noImagesAvailable')}
                                            </SelectItem>
                                        ) : (
                                            imageNames.map((name) => (
                                                <SelectItem key={name} value={name}>
                                                    <p className="truncate">{name}</p>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="trivyVersion"
                    render={({ field }) => (
                        <FormItem className="w-28 shrink-0">
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
                name="tag"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('scanTag')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="latest" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('scanTag')}</SelectLabel>
                                    {availableTags.length === 0 ? (
                                        <SelectItem value="latest">latest</SelectItem>
                                    ) : (
                                        availableTags.map((tag) => (
                                            <SelectItem key={tag} value={tag}>
                                                {tag}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
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
                        <FormLabel className={'cursor-pointer'}>
                            {t('exitOnVulnerabilities')}
                        </FormLabel>
                        <FormControl>
                            <Switch
                                className={'cursor-pointer'}
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
