'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';

export function ComposeUpConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="recreate"
                render={({ field }) => (
                    <FormItem className="border-border flex items-center rounded-md border p-3">
                        <FormLabel className="flex cursor-pointer flex-col items-start justify-between gap-1">
                            <span>{t('composeUpRecreate')}</span>
                            <FormDescription className="text-xs">{t('composeUpRecreateDescription')}</FormDescription>
                        </FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="removeOrphans"
                render={({ field }) => (
                    <FormItem className="border-border flex items-center rounded-md border p-3">
                        <FormLabel className="flex cursor-pointer flex-col items-start justify-between gap-1">
                            <span>{t('composeUpRemoveOrphans')}</span>
                            <FormDescription className="text-xs">
                                {t('composeUpRemoveOrphansDescription')}
                            </FormDescription>
                        </FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="keepComposeFile"
                render={({ field }) => (
                    <FormItem className="border-border flex items-center rounded-md border p-3">
                        <FormLabel className="flex cursor-pointer flex-col items-start justify-between gap-1">
                            <span>{t('composeUpKeepComposeFile')}</span>
                            <FormDescription className="text-xs">
                                {t('composeUpKeepComposeFileDescription')}
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
