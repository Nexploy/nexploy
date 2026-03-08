'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';

export function ValidateDockerfileConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <FormField
            control={form.control}
            name="dockerfilePath"
            render={({ field }) => (
                <FormItem className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">{t('dockerfilePath')}</Label>
                    <FormControl>
                        <Input {...field} placeholder="Dockerfile" className="border-border bg-background text-foreground focus:border-primary h-8 text-xs" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );
}
