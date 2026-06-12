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
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

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
                            <Input {...field} placeholder={t('versionTagPlaceholder')} />
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
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('gitTagMessagePlaceholder')} />
                            </RefAware>
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
                            <Input {...field} placeholder={t('gitRemotePlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
