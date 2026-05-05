'use client';

import { useEffect } from 'react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { toast } from 'sonner';
import { onInitSwarmAction } from '@/actions/docker/swarm/init.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { initActionSchema } from '@workspace/schemas-zod/docker/swarm/init.schema';
import { usePublicIp } from '@/hooks/usePublicIp';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

export function InitSwarmForm() {
    const { onSuccess, closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const { ip, isLoading: isDetecting } = usePublicIp();

    const { form, handleSubmitWithAction } = useHookFormAction(
        onInitSwarmAction,
        zodResolver(initActionSchema),
        {
            formProps: {
                defaultValues: {
                    advertiseAddr: '',
                    listenAddr: '0.0.0.0:2377',
                    forceNewCluster: false,
                },
            },
            actionProps: {
                onSuccess: async () => {
                    toast.success(t('swarmInitializedSuccess'));
                    await onSwarmRefreshAction();
                    if (onSuccess) onSuccess();
                },
            },
        },
    );

    useEffect(() => {
        if (ip) {
            form.setValue('advertiseAddr', `${ip}:2377`);
        }
    }, [ip, form]);

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="advertiseAddr"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('advertiseAddress')}{' '}
                                <span className="text-muted-foreground text-xs">
                                    {t('optional')}
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={
                                        isDetecting
                                            ? t('detectingIp')
                                            : t('advertiseAddressPlaceholder')
                                    }
                                    className="font-mono"
                                    disabled={isDetecting || form.formState.isSubmitting}
                                />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">
                                {t('advertiseAddressAutoDetect')}
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={form.formState.isSubmitting}
                    >
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        type="submit"
                        isLoading={form.formState.isSubmitting}
                        disabled={isDetecting || form.formState.isSubmitting}
                    >
                        {t('initializeSwarm')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
