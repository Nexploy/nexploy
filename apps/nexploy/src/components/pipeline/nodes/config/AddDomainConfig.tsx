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
import { Switch } from '@workspace/ui/components/switch';

export function AddDomainConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('addDomainHost')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="example.com" className="font-mono" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="containerPort"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('addDomainContainerPort')}</FormLabel>
                        <FormControl>
                            <Input {...field} type="number" placeholder="3000" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="path"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addDomainPath')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="/" className="font-mono" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="internalPath"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addDomainInternalPath')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="/" className="font-mono" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="https"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">
                            {t('addDomainHttps')}
                        </FormLabel>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="stripPath"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">
                            {t('addDomainStripPath')}
                        </FormLabel>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="certificateId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('addDomainCertificateId')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('addDomainCertificateIdPlaceholder')}
                                className="font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
