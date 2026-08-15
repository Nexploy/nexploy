'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { connectDnsAction } from '@/actions/dns/connect.action';
import { dnsConnectSchema, dnsProviderDescriptors, dnsProviderIds } from '@workspace/schemas-zod/dns/dns.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Badge } from '@workspace/ui/components/badge';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { DnsProviderId } from '@workspace/typescript-interface/dns/dns';

export function DnsConnectForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.dns');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        connectDnsAction,
        zodResolver(dnsConnectSchema),
        {
            formProps: {
                defaultValues: {
                    provider: 'CLOUDFLARE' as DnsProviderId,
                    displayName: '',
                    credentials: {},
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('connectedSuccess'));
                    closeDialog();
                },
            },
        },
    );

    const provider = (form.watch('provider') ?? 'CLOUDFLARE') as DnsProviderId;
    const descriptor = dnsProviderDescriptors[provider];
    const isSubmitting = action.status === 'executing';
    const hasProviderChoice = dnsProviderIds.length > 1;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <ul className="list-disc pl-5 text-muted-foreground text-sm">
                    <li>{t(`providers.${provider}.requirementZone`)}</li>
                    <li>{t(`providers.${provider}.requirementRecord`)}</li>
                </ul>

                {descriptor.experimental && (
                    <div className="flex items-start gap-2 rounded-md border border-current/20 bg-degraded/10 p-3 text-degraded text-xs">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        <span>{t('experimentalWarning')}</span>
                    </div>
                )}

                {hasProviderChoice && (
                    <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('provider')}</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue('credentials', {}, { shouldDirty: true });
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectProvider')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent align="start">
                                        <SelectGroup>
                                            <SelectLabel>{t('provider')}</SelectLabel>
                                            {dnsProviderIds.map((id) => (
                                                <SelectItem key={id} value={id}>
                                                    <span className="flex items-center gap-2">
                                                        {t(`providers.${id}.name`)}
                                                        {dnsProviderDescriptors[id].experimental && (
                                                            <Badge variant="warning" className="text-[10px]">
                                                                {t('experimental')}
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('displayName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('displayNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {descriptor.credentialFields.map((credentialField) => (
                    <FormField
                        key={credentialField.name}
                        control={form.control}
                        name={`credentials.${credentialField.name}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t(`providers.${provider}.fields.${credentialField.name}.label`)}</FormLabel>
                                <FormControl>
                                    <Input
                                        type={credentialField.secret ? 'password' : 'text'}
                                        placeholder={t(
                                            `providers.${provider}.fields.${credentialField.name}.placeholder`,
                                        )}
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {t('add')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
