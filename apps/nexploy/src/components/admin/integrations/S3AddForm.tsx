'use client';

import { useState } from 'react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { addS3AccountAction } from '@/actions/s3/addAccount.action';
import { s3AddAccountSchema } from '@workspace/schemas-zod/s3/s3.schema';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type ProviderId = 'aws' | 'r2' | 'b2' | 'spaces' | 'minio' | 'custom';

interface ProviderConfig {
    id: ProviderId;
    labelKey: string;
    hintKey: string;
    showEndpoint: boolean;
    fixedRegion?: string;
    regionPlaceholder: string;
    endpointPlaceholder: string;
}

const PROVIDERS: ProviderConfig[] = [
    {
        id: 'aws',
        labelKey: 'providerAws',
        hintKey: 'hintAws',
        showEndpoint: false,
        regionPlaceholder: 'us-east-1',
        endpointPlaceholder: '',
    },
    {
        id: 'r2',
        labelKey: 'providerR2',
        hintKey: 'hintR2',
        showEndpoint: true,
        fixedRegion: 'auto',
        regionPlaceholder: 'auto',
        endpointPlaceholder: 'https://<account_id>.r2.cloudflarestorage.com',
    },
    {
        id: 'b2',
        labelKey: 'providerB2',
        hintKey: 'hintB2',
        showEndpoint: true,
        regionPlaceholder: 'us-west-004',
        endpointPlaceholder: 'https://s3.us-west-004.backblazeb2.com',
    },
    {
        id: 'spaces',
        labelKey: 'providerSpaces',
        hintKey: 'hintSpaces',
        showEndpoint: true,
        regionPlaceholder: 'nyc3',
        endpointPlaceholder: 'https://nyc3.digitaloceanspaces.com',
    },
    {
        id: 'minio',
        labelKey: 'providerMinio',
        hintKey: 'hintMinio',
        showEndpoint: true,
        regionPlaceholder: 'us-east-1',
        endpointPlaceholder: 'https://minio.example.com',
    },
    {
        id: 'custom',
        labelKey: 'providerCustom',
        hintKey: 'hintCustom',
        showEndpoint: true,
        regionPlaceholder: 'us-east-1',
        endpointPlaceholder: 'https://s3.example.com',
    },
];

export function S3AddForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.s3');
    const [provider, setProvider] = useState<ProviderConfig>(PROVIDERS[0]!);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        addS3AccountAction,
        zodResolver(s3AddAccountSchema),
        {
            formProps: {
                defaultValues: {
                    displayName: '',
                    accessKeyId: '',
                    secretAccessKey: '',
                    region: '',
                    endpoint: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('addedSuccess'));
                    closeDialog();
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? t('addFailed'));
                },
            },
        },
    );

    const handleProviderChange = (id: string) => {
        const next = PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]!;
        setProvider(next);
        form.setValue('region', next.fixedRegion ?? '');
        if (!next.showEndpoint) {
            form.setValue('endpoint', '');
        }
    };

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormItem>
                    <FormLabel>{t('providerLabel')}</FormLabel>
                    <Select value={provider.id} onValueChange={handleProviderChange}>
                        <FormControl>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {PROVIDERS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {t(p.labelKey)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>{t(provider.hintKey)}</FormDescription>
                </FormItem>

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

                <FormField
                    control={form.control}
                    name="accessKeyId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('accessKeyIdLabel')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('accessKeyIdPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="secretAccessKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('secretAccessKeyLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t('secretAccessKeyPlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('regionLabel')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={provider.regionPlaceholder}
                                    readOnly={Boolean(provider.fixedRegion)}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {provider.showEndpoint && (
                    <FormField
                        control={form.control}
                        name="endpoint"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('endpointLabel')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={provider.endpointPlaceholder}
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {t('add')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
