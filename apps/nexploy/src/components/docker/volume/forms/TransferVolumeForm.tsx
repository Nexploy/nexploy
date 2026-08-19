'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { Alert, AlertTitle } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { volumeTransferFormSchema } from '@workspace/schemas-zod/docker/volume/volumeTransfer.schema';
import { onVolumeTransferAction } from '@/actions/docker/volume/volumeTransfer.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { useEnvironmentProtection } from '@/hooks/useEnvironmentProtection';

interface TransferVolumeFormProps {
    volumeNames: string[];
    onTransferred?: () => void;
}

const STOP_MODES = ['both', 'target', 'none'] as const;

export function TransferVolumeForm({ volumeNames, onTransferred }: TransferVolumeFormProps) {
    const t = useTranslations('docker.transferVolume');
    const { closeDialog } = useConfirmationDialogStore();

    const environments = useEnvironmentStore((state) => state.environments);
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);

    const { isBlockedOn } = useEnvironmentProtection();

    const targetEnvironments = useMemo(
        () =>
            environments.filter(
                (environment) =>
                    environment.id !== selectedEnvironmentId && !isBlockedOn(environment.id, 'volume.manage'),
            ),
        [environments, selectedEnvironmentId, isBlockedOn],
    );

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        onVolumeTransferAction,
        zodResolver(volumeTransferFormSchema),
        {
            formProps: {
                defaultValues: {
                    volumeNames,
                    targetEnvironmentId: targetEnvironments[0]?.id ?? '',
                    overwrite: false,
                    stopMode: 'both' as const,
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (!data) return;

                    closeDialog();
                    onTransferred?.();
                    toast.info(t('startedTitle', { count: volumeNames.length }), {
                        description: t('startedDescription'),
                    });
                },
            },
        },
    );

    if (targetEnvironments.length === 0) {
        return (
            <div className="space-y-4">
                <Alert variant="info">
                    <Info />
                    <AlertTitle className="line-clamp-0">{t('noTargetEnvironment')}</AlertTitle>
                </Alert>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <Alert variant="info">
                    <Info />
                    <AlertTitle className="line-clamp-0">
                        {t('transferWarning', { count: volumeNames.length })}
                    </AlertTitle>
                </Alert>

                <div className="flex flex-wrap gap-1.5">
                    {volumeNames.map((name) => (
                        <Badge key={name} variant="secondary" className="break-all">
                            {name}
                        </Badge>
                    ))}
                </div>

                <FormField
                    control={form.control}
                    name="targetEnvironmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('targetLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('targetPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent align="start">
                                    <SelectGroup>
                                        {targetEnvironments.map((environment) => (
                                            <SelectItem key={environment.id} value={environment.id}>
                                                {environment.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="stopMode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('stopModeLabel')}</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="gap-2">
                                    {STOP_MODES.map((mode) => (
                                        <label
                                            key={mode}
                                            htmlFor={`stop-mode-${mode}`}
                                            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                                        >
                                            <RadioGroupItem value={mode} id={`stop-mode-${mode}`} className="mt-0.5" />
                                            <div className="space-y-0.5">
                                                <p className="font-medium text-sm">{t(`stopMode.${mode}`)}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {t(`stopMode.${mode}Description`)}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="overwrite"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>{t('overwriteLabel')}</FormLabel>
                                <FormDescription>{t('overwriteDescription')}</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={action.isPending}>
                        {t('transfer')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
