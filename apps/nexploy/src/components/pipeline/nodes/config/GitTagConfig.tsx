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

export function GitTagConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="tagName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitTagName')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="v1.0.0"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitTagMessage')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('gitTagMessagePlaceholder')}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="remote"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('gitRemote')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="origin"
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
