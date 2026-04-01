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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';

export function FetchSecretsConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const provider = form.watch('provider');

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('secretsProvider')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="vault">HashiCorp Vault</SelectItem>
                                <SelectItem value="doppler">Doppler</SelectItem>
                                <SelectItem value="env-file">.env File</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            {provider === 'vault' && (
                <FormField
                    control={form.control}
                    name="endpoint"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('secretsVaultEndpoint')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder="https://vault.example.com"
                                    className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('secretsToken')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
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
                        <FormLabel>{t('secretsPath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={provider === 'env-file' ? '.env.production' : 'secret/myapp/prod'}
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="outputAs"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('secretsOutputAs')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="env-vars">{t('secretsOutputEnvVars')}</SelectItem>
                                <SelectItem value="json-file">{t('secretsOutputJsonFile')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
