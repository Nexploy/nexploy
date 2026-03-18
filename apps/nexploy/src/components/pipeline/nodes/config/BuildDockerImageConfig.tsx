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

export function BuildDockerImageConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="dockerfilePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dockerfilePath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="Dockerfile"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="dockerfileFilePath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dockerfileFilePath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('dockerfileFilePathPlaceholder')}
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
