import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { Plus } from 'lucide-react';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import {
    ContainerNetworkForm,
    containerNetworkSchema,
} from '@workspace/schemas-zod/docker/container/containerNetwork.schema';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useTranslations } from 'next-intl';

export function NetworkForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const { onNetworkChange, networkChanges } = useContainerChangesStore();
    const networks = useNetworkStore((state) => state.networks);
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.forms');

    const form = useForm<ContainerNetworkForm>({
        resolver: zodResolver(containerNetworkSchema),
        defaultValues: {
            networkName: '',
        },
    });

    const onSubmit = (data: ContainerNetworkForm) => {
        onNetworkChange({
            typeAction: 'add',
            name: data.networkName,
        });

        closeDialog();
    };

    const connectedNetworks = container ? Object.keys(container.network.networks) : [];
    const addedNetworks = networkChanges
        .filter((change) => change.typeAction === 'add')
        .map((change) => change.name);
    const deletedNetworks = networkChanges
        .filter((change) => change.typeAction === 'delete')
        .map((change) => change.currentName);

    const availableNetworks = networks.filter((network) => {
        const isConnected = connectedNetworks.includes(network.name);
        const isAdded = addedNetworks.includes(network.name);
        const isDeleted = deletedNetworks.includes(network.name);
        return (!isConnected && !isAdded) || isDeleted;
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="networkName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('network.network')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('network.selectNetwork')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableNetworks.map((network) => (
                                        <SelectItem key={network.id} value={network.name}>
                                            <div className="flex items-center gap-2">
                                                <span>{network.name}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    ({network.driver})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="flex !justify-between pt-4">
                    <div className="flex flex-1 flex-row justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">{t('cancel')}</Button>
                        </DialogClose>
                        <Button
                            className="flex-1 sm:flex-0"
                            type="submit"
                            disabled={!form.formState.isDirty}
                            icon={Plus}
                        >
                            {t('add')}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
}
