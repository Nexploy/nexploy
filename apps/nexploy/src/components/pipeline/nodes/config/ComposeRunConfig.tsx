'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function ComposeRunConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel>{t('composeService')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('composeServicePlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormDescription className="text-xs">{t('composeServiceDescription')}</FormDescription>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="command"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel>{t('composeRunCommand')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('composeRunCommandPlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormDescription className="text-xs">{t('composeRunCommandDescription')}</FormDescription>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="workingDir"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel>{t('composeRunWorkingDir')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder="/app" />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel>{t('composeRunUser')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder="root" />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="noDeps"
                render={({ field }) => (
                    <FormItem className="border-border flex items-center rounded-md border p-3">
                        <FormLabel className="flex cursor-pointer flex-col items-start justify-between gap-1">
                            <span>{t('composeRunNoDeps')}</span>
                            <FormDescription className="text-xs">{t('composeRunNoDepsDescription')}</FormDescription>
                        </FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="continueOnError"
                render={({ field }) => (
                    <FormItem className="border-border flex items-center rounded-md border p-3">
                        <FormLabel className="flex cursor-pointer flex-col items-start justify-between gap-1">
                            <span>{t('continueOnError')}</span>
                            <FormDescription className="text-xs">
                                {t('composeRunContinueOnErrorDescription')}
                            </FormDescription>
                        </FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
