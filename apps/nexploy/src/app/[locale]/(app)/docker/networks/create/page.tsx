'use client';

import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Network, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { onNetworkCreateAction } from '@/actions/docker/network/networkCreate.action';
import { toast } from 'sonner';
import { networkCreateSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { AdvancedConfig } from '@/components/docker/network/create/AdvancedConfig';
import { NetworkBasicConfig } from '@/components/docker/network/create/NetworkBasicConfig';
import { NetworkIpamConfig } from '@/components/docker/network/create/NetworkIpamConfig';
import { NetworkConfigFromExisting } from '@/components/docker/network/create/NetworkConfigFromExisting';
import { useTranslations } from 'next-intl';

export default function CreateNetworkPage() {
    const t = useTranslations('docker.createNetworkPage');
    const router = useRouter();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onNetworkCreateAction,
        zodResolver(networkCreateSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    driver: 'bridge',
                    checkDuplicate: true,
                    internal: false,
                    attachable: false,
                    enableIPv4: true,
                    enableIPv6: false,
                    ipam: undefined,
                    options: {},
                    labels: {},
                },
            },
            actionProps: {
                onExecute: ({ input }) => {
                    toast.loading(t('creatingNetwork', { name: input.name }));
                },
                onSuccess: () => {
                    toast.dismiss();
                    router.push('/docker/networks');
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex h-full flex-1 flex-col gap-4 pt-5">
            <Form {...form}>
                <form
                    className="flex flex-1 flex-col overflow-hidden"
                    onSubmit={handleSubmitWithAction}
                >
                    <div className="mb-5 flex justify-between gap-4 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <Network className="text-primary size-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    {t('title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">{t('description')}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft />
                                {t('back')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Plus />
                                {isSubmitting ? t('creating') : t('createButton')}
                            </Button>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="flex flex-col gap-4 overflow-hidden px-5 pb-5">
                            <NetworkBasicConfig />
                            <NetworkIpamConfig />
                            <NetworkConfigFromExisting />
                            <AdvancedConfig />
                        </div>
                    </ScrollAreaWithShadow>
                </form>
            </Form>
        </div>
    );
}
