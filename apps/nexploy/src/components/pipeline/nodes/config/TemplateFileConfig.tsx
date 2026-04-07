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

export function TemplateFileConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="inputPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('templateInputPath')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="template.yaml" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="outputPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('templateOutputPath')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="output.yaml" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
