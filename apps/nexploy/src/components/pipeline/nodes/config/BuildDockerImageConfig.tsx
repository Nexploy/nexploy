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
                            <Input {...field} placeholder="Dockerfile" />
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
                            <Input {...field} placeholder={t('dockerfileFilePathPlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
