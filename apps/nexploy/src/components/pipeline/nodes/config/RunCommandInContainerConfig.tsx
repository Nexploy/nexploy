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

export function RunCommandInContainerConfig() {
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
                name="command"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('command')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="npm run migrate"
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="workdir"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('workdir')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder="/app"
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
