'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
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
                                <Input {...field} placeholder={t('composeFileNamePlaceholder')} />
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
                                <Input {...field} placeholder={t('composeFilePathPlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="noCache"
                render={({ field }) => (
                    <FormItem className="border-border flex items-center rounded-md border p-3">
                        <FormLabel className="flex cursor-pointer flex-col items-start justify-between gap-1">
                            <span>{t('noCache')}</span>
                            <FormDescription className="text-xs">
                                {t('noCacheDescription')}
                            </FormDescription>
                        </FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
