'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';

export function WriteEnvFileConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <FormField
            control={form.control}
            name="useRepositoryEnvVars"
            render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                    <FormLabel>{t('useRepositoryEnvVars')}</FormLabel>
                    <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                </FormItem>
            )}
        />
    );
}
