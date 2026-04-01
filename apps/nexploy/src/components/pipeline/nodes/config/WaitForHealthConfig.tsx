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

export function WaitForHealthConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="containerName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('containerName')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={t('containerNamePlaceholder')}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('timeoutSeconds')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="number"
                                min={1}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('intervalSeconds')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="number"
                                min={1}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
