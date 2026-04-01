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

export function TagImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="sourceImage"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sourceImage')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="my-app"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="sourceTag"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sourceTag')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="latest"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="targetTag"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('targetTag')}</FormLabel>
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
        </div>
    );
}
