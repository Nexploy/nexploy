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

export function PullImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <FormField
            control={form.control}
            name="imageName"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('pullImageName')}</FormLabel>
                    <FormControl>
                        <Input
                            {...field}
                            placeholder={t('pullImageNamePlaceholder')}
                            className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                        />
                    </FormControl>
                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );
}
