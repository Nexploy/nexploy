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
    SelectGroup,
    SelectItem,
    SelectLabel,
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
import { updateEnvironmentAction } from '@/actions/environment/updateEnvironment.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Environment } from 'generated/client';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { DownloadCertScriptButton } from './DownloadCertScriptButton';

interface EditEnvironmentFormProps {
    environment: Environment;
}

export function EditEnvironmentForm({ environment }: EditEnvironmentFormProps) {
    const { onSuccess } = useConfirmationDialogStore();
    const t = useTranslations('docker.environmentForm');
    const tValidation = useTranslations('validation');

    const { form, handleSubmitWithAction } = useHookFormAction(
        updateEnvironmentAction,
        zodResolver(environmentSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    id: environment.id,
                    name: environment.name,
                    connectionType: environment.connectionType,
                    socketPath: environment.socketPath || undefined,
                    host: environment.host || undefined,
                    port: environment.port || undefined,
                    description: environment.description || '',
                    tlsCert: undefined,
                    tlsKey: undefined,
                    tlsCa: undefined,
                },
            },
            actionProps: {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                },
            },
        },
    );

    const connectionType = form.watch('connectionType');
    const host = form.watch('host');

    const handleConnectionTypeChange = (value: string) => {
        const type = value as 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
        form.setValue('connectionType', type);

        if (type === 'UNIX_SOCKET') {
            form.setValue('socketPath', '/var/run/docker.sock');
            form.setValue('host', undefined);
            form.setValue('port', undefined);
        } else {
            form.setValue('socketPath', undefined);
            form.setValue('host', 'localhost');
            form.setValue('port', 2375);
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
                                        <SelectGroup>
                                            <SelectLabel>{t('connectionType')}</SelectLabel>
                                            <SelectItem value="UNIX_SOCKET">
                                                {t('unixSocket')}
                                            </SelectItem>
                                            <SelectItem value="TCP">{t('tcp')}</SelectItem>
                                            <SelectItem value="TCP_TLS">{t('tcpTls')}</SelectItem>
                                        </SelectGroup>
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
                                        <FormLabel className="flex items-center gap-1.5">
                                            {t('host')}
                                            {connectionType === 'TCP_TLS' && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-56">
                                                        {t('hostCertWarning')}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </FormLabel>
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
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{t('tlsCertificates')}</h4>
                            <DownloadCertScriptButton disabled={!host} host={host} />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {t('tlsCertificatesDescription')}
                        </p>

                        <TlsCertificateField
                            form={form}
                            name="tlsCert"
                            label={t('clientCertificate')}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            disabled={form.formState.isSubmitting}
                            hasExistingValue={!!environment.tlsCert}
                        />

                        <TlsCertificateField
                            form={form}
                            name="tlsKey"
                            label={t('clientKey')}
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                            disabled={form.formState.isSubmitting}
                            hasExistingValue={!!environment.tlsKey}
                        />

                        <TlsCertificateField
                            form={form}
                            name="tlsCa"
                            label={t('caCertificate')}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            disabled={form.formState.isSubmitting}
                            hasExistingValue={!!environment.tlsCa}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? t('updating') : t('updateEnvironment')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
