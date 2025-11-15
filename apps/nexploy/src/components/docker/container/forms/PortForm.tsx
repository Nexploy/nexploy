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
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import {
    ContainerPortForm,
    containerPortSchema,
} from '@workspace/schemas-zod/container/containerPort.schema';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { Plus, Save, Trash } from 'lucide-react';
import { PortFormProps } from '@workspace/typescript-interface/docker/docker.port';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';

export function PortForm({ mode, defaultPort, originalPort }: PortFormProps) {
    const { closeDialog } = useConfirmationDialogStore();
    const { onPortChange } = useContainerChangesStore();

    const form = useForm<ContainerPortForm>({
        resolver: zodResolver(containerPortSchema),
        defaultValues: {
            privatePort: defaultPort?.privatePort ?? 0,
            publicPort: defaultPort?.publicPort ?? 0,
            type: defaultPort?.type ?? 'tcp',
        },
    });

    const onSubmit = (data: ContainerPortForm) => {
        if (mode === 'add') {
            onPortChange({
                typeAction: 'add',
                publicPort: data.publicPort,
                privatePort: data.privatePort,
                type: data.type,
            });
        } else if (mode === 'edit') {
            const referencePort = originalPort ?? defaultPort;

            onPortChange({
                typeAction: 'edit',
                publicPort: data.publicPort,
                privatePort: data.privatePort,
                type: data.type,
                currentPublicPort: referencePort?.publicPort,
                currentPrivatePort: referencePort?.privatePort,
                currentType: referencePort?.type,
            });
        }

        closeDialog();
    };

    const handleDelete = () => {
        if (!defaultPort) return;

        const referencePort = originalPort ?? defaultPort;

        onPortChange({
            typeAction: 'delete',
            currentPublicPort: referencePort.publicPort,
            currentPrivatePort: referencePort.privatePort,
            currentType: referencePort.type,
        });

        closeDialog();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="publicPort"
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
                    name="privatePort"
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
                    name="type"
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

                <DialogFooter className={'flex !justify-between pt-4'}>
                    {mode === 'edit' && (
                        <Button
                            size={'icon'}
                            type="button"
                            variant="destructive"
                            icon={Trash}
                            onClick={handleDelete}
                        />
                    )}
                    <div className={'flex flex-1 flex-row justify-end gap-2'}>
                        <DialogClose asChild>
                            <Button variant={'outline'}>Annuler</Button>
                        </DialogClose>
                        <Button
                            className={'flex-1 sm:flex-0'}
                            type="submit"
                            disabled={!form.formState.isDirty}
                            icon={mode === 'add' ? Plus : Save}
                        >
                            {mode === 'add' ? 'Ajouter' : 'Modifier'}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
}
