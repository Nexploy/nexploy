'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { environmentSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { TlsCertificateField } from './TlsCertificateField';
import { createEnvironmentAction } from '@/actions/environment/createEnvironment.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

export function CreateEnvironmentForm() {
    const { onSuccess } = useConfirmationDialogStore();
    const t = useTranslations('docker.environmentForm');

    const { form, handleSubmitWithAction } = useHookFormAction(
        createEnvironmentAction,
        zodResolver(environmentSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    connectionType: 'UNIX_SOCKET' as const,
                    socketPath: '/var/run/docker.sock',
                    description: '',
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data && onSuccess) onSuccess(data);
                },
            },
        },
    );

    const connectionType = form.watch('connectionType');

    const handleConnectionTypeChange = (value: string) => {
        const type = value as 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
        form.setValue('connectionType', type);

        form.setValue('socketPath', undefined);
        form.setValue('host', undefined);
        form.setValue('port', undefined);
        form.setValue('tlsCert', undefined);
        form.setValue('tlsKey', undefined);
        form.setValue('tlsCa', undefined);

        if (type === 'UNIX_SOCKET') {
            form.setValue('socketPath', '/var/run/docker.sock');
        } else if (type === 'TCP' || type === 'TCP_TLS') {
            form.setValue('host', 'localhost');
            form.setValue('port', type === 'TCP_TLS' ? 2376 : 2375);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('environmentName')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={t('environmentNamePlaceholder')}
                                    disabled={form.formState.isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('description')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder={t('descriptionPlaceholder')}
                                    disabled={form.formState.isSubmitting}
                                    value={field.value === '' ? undefined : field.value}
                                    rows={2}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="connectionType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('connectionType')}</FormLabel>
                            <FormControl>
                                <Select
                                    {...field}
                                    value={connectionType}
                                    onValueChange={handleConnectionTypeChange}
                                    disabled={form.formState.isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectConnectionType')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNIX_SOCKET">
                                            {t('unixSocket')}
                                        </SelectItem>
                                        <SelectItem value="TCP">{t('tcp')}</SelectItem>
                                        <SelectItem value="TCP_TLS">{t('tcpTls')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {connectionType === 'UNIX_SOCKET' && (
                    <FormField
                        control={form.control}
                        name="socketPath"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('socketPath')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="/var/run/docker.sock"
                                        {...field}
                                        disabled={form.formState.isSubmitting}
                                    />
                                </FormControl>
                                <p className="text-muted-foreground text-xs">
                                    {t('socketPathDescription')}
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {(connectionType === 'TCP' || connectionType === 'TCP_TLS') && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="host"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('host')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('hostPlaceholder')}
                                                {...field}
                                                disabled={form.formState.isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('port')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={t('portPlaceholder')}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(e.target.valueAsNumber)
                                                }
                                                disabled={form.formState.isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <p className="text-muted-foreground text-xs">{t('standardPorts')}</p>
                    </>
                )}
                {connectionType === 'TCP_TLS' && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="text-sm font-medium">{t('tlsCertificates')}</h4>
                        <p className="text-muted-foreground text-xs">
                            {t('tlsCertificatesDescription')}
                        </p>

                        <TlsCertificateField
                            form={form}
                            name="tlsCert"
                            label={t('clientCertificate')}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            disabled={form.formState.isSubmitting}
                        />

                        <TlsCertificateField
                            form={form}
                            name="tlsKey"
                            label={t('clientKey')}
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                            disabled={form.formState.isSubmitting}
                        />

                        <TlsCertificateField
                            form={form}
                            name="tlsCa"
                            label={t('caCertificate')}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            disabled={form.formState.isSubmitting}
                        />
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="submit"
                        isLoading={form.formState.isSubmitting}
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? t('adding') : t('addEnvironment')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
