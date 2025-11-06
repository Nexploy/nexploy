import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import {
    ContainerPortForm,
    containerPortSchema,
} from '@workspace/schemas-zod/container/containerPort.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { onContainerAddPortAction } from '@/actions/docker/container/port/containerAddPort.action';
import { onContainerEditPortAction } from '@/actions/docker/container/port/containerEditPortAction';
import { useRouter } from 'next/navigation';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Plus, Save } from 'lucide-react';
import { PortFormProps } from '@workspace/typescript-interface/docker/docker.port';

export function PortForm({ mode, defaultPort }: PortFormProps) {
    const container = useContainerStore((state) => state.container);
    const { closeDialog } = useConfirmationDialogStore();
    const router = useRouter();

    const createActionConfig = {
        add: {
            action: onContainerAddPortAction,
            buttonLabel: 'Ajouter',
            pendingLabel: 'Ajout en cours...',
            icon: Plus,
            onSuccess: ({
                data,
                input,
            }: {
                data: Awaited<ReturnType<typeof onContainerAddPortAction>>['data'];
                input: ContainerPortForm;
            }) => {
                if (!data) return;
                router.replace(`/docker/containers/${data.id}`);
                toast.dismiss();
                toast.success(
                    `Le port (${input.hostPort} → ${input.containerPort}) a bien été ajouté`,
                );
                closeDialog();
            },
        },
        edit: {
            action: onContainerEditPortAction.bind(null, {
                currentContainerPort: defaultPort?.privatePort ?? 0,
                currentHostPort: defaultPort?.publicPort ?? 0,
                currentProtocol: defaultPort?.type ?? 'tcp',
            }),
            buttonLabel: 'Modifier',
            pendingLabel: 'Modification en cours...',
            icon: Save,
            onSuccess: ({
                data,
                input,
            }: {
                data: Awaited<ReturnType<typeof onContainerEditPortAction>>['data'];
                input: ContainerPortForm;
            }) => {
                if (!data) return;
                toast.dismiss();
                toast.success(
                    `Le port (${input.hostPort} → ${input.containerPort}) a bien été modifié`,
                );

                router.replace(`/docker/containers/${data.id}`);
                closeDialog();
            },
        },
    };

    const config = createActionConfig[mode];

    const {
        form,
        action: formAction,
        handleSubmitWithAction,
    } = useHookFormAction(config.action, zodResolver(containerPortSchema), {
        formProps: {
            defaultValues: {
                containerId: container?.id ?? '',
                containerPort: defaultPort?.privatePort ?? 0,
                hostPort: defaultPort?.publicPort ?? 0,
                protocol: defaultPort?.type ?? 'tcp',
            },
        },
        actionProps: {
            onSuccess: config.onSuccess,
        },
    });

    const Icon = config.icon;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="hostPort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Port hôte</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="8080"
                                    type="number"
                                    value={field.value || ''}
                                    onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || undefined)
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="containerPort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Port conteneur</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    placeholder="80"
                                    value={field.value || ''}
                                    onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || undefined)
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="protocol"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Protocole</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un protocole" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="tcp">TCP</SelectItem>
                                    <SelectItem value="udp">UDP</SelectItem>
                                    <SelectItem value="sctp">SCTP</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={formAction.isPending}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        icon={Icon}
                        isLoading={formAction.isPending}
                        disabled={formAction.isPending}
                    >
                        {formAction.isPending ? config.pendingLabel : config.buttonLabel}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
