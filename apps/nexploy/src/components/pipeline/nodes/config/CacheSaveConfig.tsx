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
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function CacheSaveConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

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
                                <Input
                                    {...field}
                                    placeholder={t('cacheVolumeNamePlaceholder')}
                                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="sourcePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('cacheSourcePath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    placeholder={t('cachePathPlaceholder')}
                                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                                />
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
                                <Input
                                    {...field}
                                    placeholder={t('cacheKeyPlaceholder')}
                                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
