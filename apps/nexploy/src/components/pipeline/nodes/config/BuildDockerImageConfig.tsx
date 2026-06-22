'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware.tsx';

export function BuildDockerImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="dockerfilePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dockerfilePath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('dockerfileNamePlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="dockerfileFilePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dockerfileFilePath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value ?? ''} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder={t('dockerfileFilePathPlaceholder')}
                                />
                            </RefAware>
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
                        <FormLabel>{t('imageName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value ?? ''} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder={t('buildImageNamePlaceholder')}
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
