'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function FetchSecretsInfisicalConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const authMethod = useWatch({ control: form.control, name: 'authMethod' });

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="siteUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('infisicalSiteUrl')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('infisicalSiteUrlPlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormDescription className="text-xs">{t('infisicalSiteUrlDescription')}</FormDescription>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="authMethod"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('infisicalAuthMethod')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="universal-auth">{t('infisicalAuthMethodUniversal')}</SelectItem>
                                <SelectItem value="access-token">{t('infisicalAuthMethodToken')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            {authMethod === 'access-token' ? (
                <FormField
                    control={form.control}
                    name="accessToken"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('infisicalAccessToken')}</FormLabel>
                            <FormControl>
                                <RefAware value={field.value} onChange={field.onChange}>
                                    <Input {...field} type="password" placeholder={t('passwordPlaceholder')} />
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            ) : (
                <>
                    <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('infisicalClientId')}</FormLabel>
                                <FormControl>
                                    <RefAware value={field.value} onChange={field.onChange}>
                                        <Input {...field} placeholder={t('infisicalClientIdPlaceholder')} />
                                    </RefAware>
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="clientSecret"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('infisicalClientSecret')}</FormLabel>
                                <FormControl>
                                    <RefAware value={field.value} onChange={field.onChange}>
                                        <Input {...field} type="password" placeholder={t('passwordPlaceholder')} />
                                    </RefAware>
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                </>
            )}
            <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('infisicalProjectId')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('infisicalProjectIdPlaceholder')} />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('infisicalEnvironment')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('infisicalEnvironmentPlaceholder')} />
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
                        <FormLabel>{t('infisicalSecretPath')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder="/" />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="recursive"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2">
                        <FormLabel>{t('infisicalRecursive')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="expandSecretReferences"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2">
                        <FormLabel>{t('infisicalExpandReferences')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="includeImports"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2">
                        <FormLabel>{t('infisicalIncludeImports')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
