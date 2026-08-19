'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldOff } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { networkExposureSettingsSchema } from '@workspace/schemas-zod/docker/system/networkExposure.schema';
import type { PubliclyExposedContainer } from '@workspace/typescript-interface/docker/docker.networkExposure';
import { updateNetworkExposureSettingsAction } from '@/actions/admin/networkExposure/updateNetworkExposureSettings.action';
import { onContainerRecreateAction } from '@/actions/docker/container/containerRecreate.action';

interface NetworkExposureCardSettings {
    bindLoopbackOnly: boolean;
}

export function NetworkExposureCard({ settings }: { settings: NetworkExposureCardSettings }) {
    const t = useTranslations('admin.settings');
    const [exposedContainers, setExposedContainers] = useState<PubliclyExposedContainer[]>([]);
    const [rebindingId, setRebindingId] = useState<string | null>(null);

    const loadExposedContainers = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/network-exposure/exposed-containers');
            if (!response.ok) return;
            const data = (await response.json()) as { containers: PubliclyExposedContainer[] };
            setExposedContainers(data.containers);
        } catch {
            /* empty */
        }
    }, []);

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateNetworkExposureSettingsAction,
        zodResolver(networkExposureSettingsSchema),
        {
            formProps: {
                defaultValues: { bindLoopbackOnly: settings.bindLoopbackOnly },
            },
            actionProps: {
                onSuccess: ({ input }) => {
                    form.reset(input);
                    toast.success(t('networkExposureSaved'));
                    loadExposedContainers();
                },
            },
        },
    );

    const bindLoopbackOnly = form.watch('bindLoopbackOnly');

    useEffect(() => {
        loadExposedContainers();
    }, [loadExposedContainers]);

    const handleRebind = async (containerId: string) => {
        setRebindingId(containerId);
        try {
            const result = await onContainerRecreateAction({
                containerId,
                ports: [],
                envVars: [],
                volumes: [],
                networks: [],
            });
            if (result?.serverError) {
                toast.error(result.serverError);
                return;
            }
            toast.success(t('networkExposureRebound'));
            await loadExposedContainers();
        } finally {
            setRebindingId(null);
        }
    };

    return (
        <Card>
            <CardHeaderWithIcon
                icon={ShieldOff}
                title={t('networkExposureTitle')}
                description={t('networkExposureDescription')}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="bindLoopbackOnly"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                        <div className="flex flex-col">
                                            <span className="text-base">{t('networkExposureBindLoopback')}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('networkExposureBindLoopbackDescription')}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormLabel>
                                </FormItem>
                            )}
                        />

                        {bindLoopbackOnly && !form.formState.isDirty && exposedContainers.length > 0 && (
                            <Alert variant="destructive">
                                <AlertTitle>{t('networkExposureStillExposedTitle')}</AlertTitle>
                                <AlertDescription className="flex flex-col gap-3">
                                    <span>
                                        {t('networkExposureStillExposedDescription', {
                                            count: exposedContainers.length,
                                        })}
                                    </span>
                                    <div className="flex flex-col gap-2">
                                        {exposedContainers.map((container) => (
                                            <div
                                                key={container.id}
                                                className="flex items-center justify-between gap-3 rounded-md border p-2"
                                            >
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate font-medium text-sm">
                                                        {container.name}
                                                    </span>
                                                    <span className="truncate text-muted-foreground text-xs">
                                                        {container.ports
                                                            .map(
                                                                (port) =>
                                                                    `${port.publicPort} → ${port.privatePort}/${port.type}`,
                                                            )
                                                            .join(', ')}
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={rebindingId === container.id}
                                                    onClick={() => handleRebind(container.id)}
                                                >
                                                    {t('networkExposureRebind')}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            disabled={action.isPending || !form.formState.isDirty}
                            className="self-end"
                        >
                            {t('save')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
