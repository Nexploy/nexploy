'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';

export function SendNotificationConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">{t('webhookUrl')}</Label>
                        <FormControl>
                            <Input {...field} placeholder="https://hooks.example.com/…" className="border-border bg-background text-foreground focus:border-primary h-8 text-xs" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">{t('message')}</Label>
                        <FormControl>
                            <Input {...field} value={field.value ?? ''} placeholder={t('messagePlaceholder')} className="border-border bg-background text-foreground focus:border-primary h-8 text-xs" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
