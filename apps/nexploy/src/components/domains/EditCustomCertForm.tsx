'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateCustomCertSchema } from '@workspace/schemas-zod/repository/sslCertificate.schema';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Asterisk } from 'lucide-react';
import { updateCustomCert } from '@/actions/repository/sslCertificate/updateCustomCert.action';
import { isWildcardDomain, resolveCoveredDomains, type SSLCertRow } from '@/components/ssl/ColumnsSSL';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface EditCustomCertFormProps {
    certificate: SSLCertRow;
    onClose: () => void;
}

export function EditCustomCertForm({ certificate, onClose }: EditCustomCertFormProps) {
    const t = useTranslations('repository.settings.ssl');
    const router = useRouter();

    const currentCoveredDomains = resolveCoveredDomains(certificate);

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateCustomCert,
        zodResolver(updateCustomCertSchema),
        {
            formProps: {
                defaultValues: {
                    id: certificate.id,
                    name: certificate.name,
                    domain: certificate.domain,
                    certificate: '',
                    privateKey: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('updatedSuccess'));
                    router.refresh();
                    onClose();
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <div className="grid items-start gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('name')}</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder={t('namePlaceholder')} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('domain')}</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="*.example.com" className="font-mono" />
                                </FormControl>
                                <FormDescription>{t('domainIsLabelOnly')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {currentCoveredDomains.length > 0 && (
                    <div className="space-y-2 rounded-lg border p-3">
                        <p className="font-medium text-sm">{t('currentCoverage')}</p>
                        <div className="flex flex-wrap gap-1">
                            {currentCoveredDomains.map((coveredDomain) =>
                                isWildcardDomain(coveredDomain) ? (
                                    <Badge
                                        key={coveredDomain}
                                        variant="outline"
                                        title={t('wildcardHint')}
                                        className="border-amber-500/50 bg-amber-500/10 font-mono text-[11px] text-amber-600"
                                    >
                                        <Asterisk className="mr-0.5 size-3" />
                                        {coveredDomain}
                                    </Badge>
                                ) : (
                                    <Badge key={coveredDomain} variant="secondary" className="font-mono text-[11px]">
                                        {coveredDomain}
                                    </Badge>
                                ),
                            )}
                        </div>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="certificate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('replaceCertificate')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                    className="h-32 font-mono text-xs"
                                />
                            </FormControl>
                            <FormDescription>{t('replaceKeepBlank')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="privateKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('replacePrivateKey')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                    className="h-32 font-mono text-xs"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                        {t('save')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
