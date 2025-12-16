'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type CreateEnvironmentInput,
    environmentSchema,
} from '@workspace/schemas-zod/environment/environment.schema';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { createEnvironmentAction } from '@/actions/environment/environment.action';
import { useAction } from 'next-safe-action/hooks';

interface CreateEnvironmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (environment: any) => void;
}

export function CreateEnvironmentForm({
    open,
    onOpenChange,
    onSuccess,
}: CreateEnvironmentFormProps) {
    const [connectionType, setConnectionType] = useState<'UNIX_SOCKET' | 'TCP' | 'TCP_TLS'>(
        'UNIX_SOCKET',
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,
    } = useForm<CreateEnvironmentInput>({
        resolver: zodResolver(environmentSchema),
        defaultValues: {
            name: '',
            connectionType: 'UNIX_SOCKET',
            socketPath: '/var/run/docker.sock',
            description: '',
        },
    });

    const { execute: executeCreateEnvironment, isExecuting } = useAction(createEnvironmentAction, {
        onSuccess: ({ data }) => {
            if (data) {
                onSuccess(data);
                reset();
                onOpenChange(false);
            }
        },
        onError: ({ error }) => {
            console.error('Failed to create environment:', error);
        },
    });

    const onSubmit = (data: CreateEnvironmentInput) => {
        executeCreateEnvironment(data);
    };

    const handleConnectionTypeChange = (value: string) => {
        const type = value as 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
        setConnectionType(type);
        setValue('connectionType', type);

        // Reset connection fields when changing type
        if (type === 'UNIX_SOCKET') {
            setValue('socketPath', '/var/run/docker.sock');
            setValue('host', undefined);
            setValue('port', undefined);
        } else {
            setValue('socketPath', undefined);
            setValue('host', 'localhost');
            setValue('port', 2375);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Docker environment</DialogTitle>
                    <DialogDescription>
                        Add a new Docker environment to manage containers across different hosts.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Environment Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Environment name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g. Production, Staging, Development..."
                            {...register('name')}
                            disabled={isExecuting}
                        />
                        {errors.name && (
                            <p className="text-destructive text-sm">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe this environment..."
                            {...register('description')}
                            disabled={isExecuting}
                            rows={2}
                        />
                    </div>

                    {/* Connection Type */}
                    <div className="space-y-2">
                        <Label htmlFor="connectionType">
                            Connection type <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={connectionType}
                            onValueChange={handleConnectionTypeChange}
                            disabled={isExecuting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select connection type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UNIX_SOCKET">Unix Socket (Local)</SelectItem>
                                <SelectItem value="TCP">TCP (Remote)</SelectItem>
                                <SelectItem value="TCP_TLS">
                                    TCP with TLS (Secure Remote)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.connectionType && (
                            <p className="text-destructive text-sm">
                                {errors.connectionType.message}
                            </p>
                        )}
                    </div>

                    {/* Unix Socket Path */}
                    {connectionType === 'UNIX_SOCKET' && (
                        <div className="space-y-2">
                            <Label htmlFor="socketPath">
                                Socket path <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="socketPath"
                                placeholder="/var/run/docker.sock"
                                {...register('socketPath')}
                                disabled={isExecuting}
                            />
                            {errors.socketPath && (
                                <p className="text-destructive text-sm">
                                    {errors.socketPath.message}
                                </p>
                            )}
                            <p className="text-muted-foreground text-xs">
                                Path to the Docker daemon socket file
                            </p>
                        </div>
                    )}

                    {/* TCP Connection */}
                    {(connectionType === 'TCP' || connectionType === 'TCP_TLS') && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="host">
                                        Host <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="host"
                                        placeholder="e.g. localhost, 192.168.1.100"
                                        {...register('host')}
                                        disabled={isExecuting}
                                    />
                                    {errors.host && (
                                        <p className="text-destructive text-sm">
                                            {errors.host.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="port">
                                        Port <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="port"
                                        type="number"
                                        placeholder="2375 or 2376"
                                        {...register('port', { valueAsNumber: true })}
                                        disabled={isExecuting}
                                    />
                                    {errors.port && (
                                        <p className="text-destructive text-sm">
                                            {errors.port.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Standard ports: 2375 (unencrypted), 2376 (TLS)
                            </p>
                        </>
                    )}

                    {/* TLS Certificates */}
                    {connectionType === 'TCP_TLS' && (
                        <div className="space-y-4 rounded-lg border p-4">
                            <h4 className="text-sm font-medium">TLS Certificates</h4>
                            <p className="text-muted-foreground text-xs">
                                Provide the TLS certificates for secure connection
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="tlsCert">Client Certificate</Label>
                                <Textarea
                                    id="tlsCert"
                                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                    {...register('tlsCert')}
                                    disabled={isExecuting}
                                    rows={4}
                                    className="font-mono text-xs"
                                />
                                {errors.tlsCert && (
                                    <p className="text-destructive text-sm">
                                        {errors.tlsCert.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tlsKey">Client Key</Label>
                                <Textarea
                                    id="tlsKey"
                                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                    {...register('tlsKey')}
                                    disabled={isExecuting}
                                    rows={4}
                                    className="font-mono text-xs"
                                />
                                {errors.tlsKey && (
                                    <p className="text-destructive text-sm">
                                        {errors.tlsKey.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tlsCa">CA Certificate</Label>
                                <Textarea
                                    id="tlsCa"
                                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                    {...register('tlsCa')}
                                    disabled={isExecuting}
                                    rows={4}
                                    className="font-mono text-xs"
                                />
                                {errors.tlsCa && (
                                    <p className="text-destructive text-sm">
                                        {errors.tlsCa.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                onOpenChange(false);
                            }}
                            disabled={isExecuting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isExecuting}>
                            {isExecuting ? 'Creating...' : 'Create environment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
