'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { scaleServiceFormSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { onScaleServiceAction } from '@/actions/docker/swarm/scaleService.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';

interface ScaleServiceFormProps {
    service: SwarmService;
}

export function ScaleServiceForm({ service }: ScaleServiceFormProps) {
    const t = useTranslations('swarm');
    const closeDialog = useConfirmationDialogStore((state) => state.closeDialog);

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        onScaleServiceAction,
        zodResolver(scaleServiceFormSchema),
        {
            formProps: {
                defaultValues: {
                    id: service.id,
                    replicas: service.replicas,
                },
            },
            actionProps: {
                onSuccess: () => closeDialog(),
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="replicas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('replicaCount')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value as number}
                                    type="number"
                                    min={0}
                                    disabled={action.isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={action.isPending}>
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                    <Button type="submit" isLoading={action.isPending}>
                        {t('scaleService')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
