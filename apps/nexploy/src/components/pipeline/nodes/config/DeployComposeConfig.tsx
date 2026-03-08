'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';

export function DeployComposeConfig() {
    const t = useTranslations('repository.pipeline.config');

    const form = useFormContext();
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="composeFileName"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">
                            {t('composeFileName')}
                        </Label>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="docker-compose.yml"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="composeFilePath"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">
                            {t('composeFilePath')}
                        </Label>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('composeFilePathPlaceholder')}
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
