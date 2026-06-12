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

export function DeployComposeConfig() {
    const t = useTranslations('repository.pipeline.config');

    const form = useFormContext();
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="composeFileName"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel>{t('composeFileName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    placeholder={t('composeFileNamePlaceholder')}
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
                name="composeFilePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('composeFilePath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    placeholder={t('composeFilePathPlaceholder')}
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
