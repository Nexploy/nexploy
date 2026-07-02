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

export function ValidateDockerfileConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <FormField
            control={form.control}
            name="dockerfilePath"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('dockerfilePath')}</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder={t('dockerfileNamePlaceholder')} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );
}
