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
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select.tsx';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function AddSslCertificateConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const certType = useWatch({ control: form.control, name: 'certType' });

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="certType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sslCertType')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="LETS_ENCRYPT">{t('sslLetsEncrypt')}</SelectItem>
                                <SelectItem value="CUSTOM">{t('sslCustom')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sslName')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('sslNamePlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('sslDomain')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder={t('domainPlaceholder')}
                                className="font-mono"
                            />
                        </FormControl>
                        {certType === 'LETS_ENCRYPT' && (
                            <FormDescription className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="size-3.5 shrink-0" />
                                {t('sslDomainMustPoint')}
                            </FormDescription>
                        )}
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            {certType === 'LETS_ENCRYPT' && (
                <>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('sslEmail')}</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value ?? ''}
                                        type="email"
                                        placeholder={t('emailPlaceholder')}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="agreedToTos"
                        render={({ field }) => (
                            <FormItem className="flex gap-3">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="cursor-pointer">
                                    {t('sslAgreeToTos')}{' '}
                                    <Link
                                        href="https://letsencrypt.org/repository/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline underline-offset-4"
                                    >
                                        {t('sslTosLink')}
                                    </Link>
                                    <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                </>
            )}
            {certType === 'CUSTOM' && (
                <>
                    <FormField
                        control={form.control}
                        name="certificate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('sslCertificate')}</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        placeholder={t('tlsCertPlaceholder')}
                                        className="h-28 font-mono text-xs"
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="privateKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('sslPrivateKey')}</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        placeholder={t('tlsKeyPlaceholder')}
                                        className="h-28 font-mono text-xs"
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                </>
            )}
        </div>
    );
}
