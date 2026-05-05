'use client';

import { useFieldArray } from 'react-hook-form';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { onCreateServiceAction } from '@/actions/docker/swarm/serviceAction.action';
import { createServiceSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

export function CreateServiceForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        onCreateServiceAction,
        zodResolver(createServiceSchema),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    image: '',
                    replicas: 1,
                    ports: [],
                },
            },
            actionProps: {
                onSuccess: ({ input }) => {
                    toast.success(t('serviceCreatedSuccess', { name: input.name }));
                    closeDialog();
                },
            },
        },
    );

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'ports',
    });

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="grid gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('serviceName')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="my-service" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('imageName')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={t('imagePlaceholder')}
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="replicas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('replicaCount')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) =>
                                        field.onChange(parseInt(e.target.value, 10) || 1)
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Label>{t('ports')}</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ published: 80, target: 80, protocol: 'tcp' })}
                        >
                            <Plus />
                            {t('addPort')}
                        </Button>
                    </div>
                    {fields.map((portField, index) => (
                        <div key={portField.id} className="flex gap-2">
                            <FormField
                                control={form.control}
                                name={`ports.${index}.published`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder={t('publishedPort')}
                                                className="font-mono"
                                                onChange={(e) =>
                                                    field.onChange(
                                                        parseInt(e.target.value, 10) || 0,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <span className="text-muted-foreground mt-1.5">→</span>
                            <FormField
                                control={form.control}
                                name={`ports.${index}.target`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={t('targetPort')}
                                                className="font-mono"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        parseInt(e.target.value, 10) || 0,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="destructiveGhost"
                                size="icon"
                                onClick={() => remove(index)}
                            >
                                <X />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={action.isPending}
                    >
                        {tCommon('cancel')}
                    </Button>
                    <Button type="submit" isLoading={action.isPending} disabled={action.isPending}>
                        {t('createService')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
