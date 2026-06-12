'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function FetchSecretsVaultConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="endpoint"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('vaultEndpoint')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('vaultEndpointPlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('vaultToken')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} type="password" placeholder={t('passwordPlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="secretPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('vaultSecretPath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    placeholder={t('vaultSecretPathPlaceholder')}
                                    className="font-mono"
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="kvVersion"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('vaultKvVersion')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('vaultKvVersion')}</SelectLabel>
                                    <SelectItem value="v2">KV v2</SelectItem>
                                    <SelectItem value="v1">KV v1</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="namespace"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('vaultNamespace')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('vaultNamespacePlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
