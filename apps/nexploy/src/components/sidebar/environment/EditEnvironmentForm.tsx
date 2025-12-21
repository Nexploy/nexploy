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
import { updateEnvironmentAction } from '@/actions/environment/environment.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Environment } from 'generated/client';
import { decrypt } from '@/lib/encryption';

interface EditEnvironmentFormProps {
    environment: Environment;
}

export function EditEnvironmentForm({ environment }: EditEnvironmentFormProps) {
    const { onSuccess } = useConfirmationDialogStore();

    const decryptedTlsCert = environment.tlsCert ? decrypt(environment.tlsCert) : undefined;
    const decryptedTlsKey = environment.tlsKey ? decrypt(environment.tlsKey) : undefined;
    const decryptedTlsCa = environment.tlsCa ? decrypt(environment.tlsCa) : undefined;

    const { form, handleSubmitWithAction } = useHookFormAction(
        updateEnvironmentAction,
        zodResolver(environmentSchema),
        {
            formProps: {
                defaultValues: {
                    name: environment.name,
                    connectionType: environment.connectionType,
                    socketPath: environment.socketPath || '/var/run/docker.sock',
                    host: environment.host || undefined,
                    port: environment.port || undefined,
                    description: environment.description || '',
                    tlsCert: decryptedTlsCert,
                    tlsKey: decryptedTlsKey,
                    tlsCa: decryptedTlsCa,
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
                            <FormLabel>Environment name</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g. Production, Staging, Development..."
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
                            <FormLabel>Description (optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Describe this environment..."
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
                            <FormLabel>Connection type</FormLabel>
                            <FormControl>
                                <Select
                                    {...field}
                                    value={connectionType}
                                    onValueChange={handleConnectionTypeChange}
                                    disabled={form.formState.isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select connection type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNIX_SOCKET">
                                            Unix Socket (Local)
                                        </SelectItem>
                                        <SelectItem value="TCP">TCP (Remote)</SelectItem>
                                        <SelectItem value="TCP_TLS">
                                            TCP with TLS (Secure Remote)
                                        </SelectItem>
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
                                <FormLabel>Socket path</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="/var/run/docker.sock"
                                        {...field}
                                        disabled={form.formState.isSubmitting}
                                    />
                                </FormControl>
                                <p className="text-muted-foreground text-xs">
                                    Path to the Docker daemon socket file
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
                                        <FormLabel>Host</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. localhost, 192.168.1.100"
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
                                        <FormLabel>Port</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="2375 or 2376"
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
                        <p className="text-muted-foreground text-xs">
                            Standard ports: 2375 (unencrypted), 2376 (TLS)
                        </p>
                    </>
                )}

                {connectionType === 'TCP_TLS' && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="text-sm font-medium">TLS Certificates</h4>
                        <p className="text-muted-foreground text-xs">
                            Provide the TLS certificates for secure connection
                        </p>

                        <FormField
                            control={form.control}
                            name="tlsCert"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Certificate</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                            {...field}
                                            disabled={form.formState.isSubmitting}
                                            rows={4}
                                            className="font-mono text-xs"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tlsKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Key</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                            {...field}
                                            disabled={form.formState.isSubmitting}
                                            rows={4}
                                            className="font-mono text-xs"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tlsCa"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CA Certificate</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                            {...field}
                                            disabled={form.formState.isSubmitting}
                                            rows={4}
                                            className="font-mono text-xs"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Updating...' : 'Update environment'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
