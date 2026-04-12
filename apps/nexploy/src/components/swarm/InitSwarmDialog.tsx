'use client';

import { useEffect, useState } from 'react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
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
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { onInitSwarmAction } from '@/actions/docker/swarm/init.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { initActionSchema } from '@workspace/schemas-zod/docker/swarm/init.schema';
import { usePublicIp } from '@/hooks/usePublicIp';
import { useTranslations } from 'next-intl';

interface InitSwarmDialogProps {
    trigger?: React.ReactNode;
    onInitSuccess?: () => void;
}

export function InitSwarmDialog({ trigger, onInitSuccess }: InitSwarmDialogProps) {
    const [open, setOpen] = useState(false);
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
                    setOpen(false);
                    await onSwarmRefreshAction();
                    onInitSuccess?.();
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Play />
                        {t('initializeSwarm')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('initializeSwarmTitle')}</DialogTitle>
                    <DialogDescription>{t('initializeSwarmDescription')}</DialogDescription>
                </DialogHeader>

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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
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
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
