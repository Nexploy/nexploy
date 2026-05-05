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
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware.tsx';

export function ScaleServiceConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('serviceName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder="my-stack_web" />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="replicas"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('serviceReplicas')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="number"
                                min={0}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
