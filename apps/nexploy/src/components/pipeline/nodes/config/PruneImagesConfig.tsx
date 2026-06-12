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
import { Switch } from '@workspace/ui/components/switch';

export function PruneImagesConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="dangling"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('pruneOnlyDangling')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="olderThan"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('pruneOlderThan')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('pruneOlderThanPlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="filter"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('pruneFilter')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('pruneFilterPlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
