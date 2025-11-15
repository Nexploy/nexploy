import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { Plus } from 'lucide-react';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import {
    ContainerVolumeForm,
    containerVolumeSchema,
} from '@workspace/schemas-zod/container/containerVolume.schema';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';

export function VolumeForm() {
    const { closeDialog } = useConfirmationDialogStore();
    const { onVolumeChange } = useContainerChangesStore();

    const form = useForm<ContainerVolumeForm>({
        resolver: zodResolver(containerVolumeSchema),
        defaultValues: {
            hostPath: '',
            containerPath: '',
            readOnly: false,
        },
    });

    const onSubmit = (data: ContainerVolumeForm) => {
        onVolumeChange({
            typeAction: 'add',
            hostPath: data.hostPath,
            containerPath: data.containerPath,
            readOnly: data.readOnly,
        });

        closeDialog();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="hostPath"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chemin hôte</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="/path/on/host" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="containerPath"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chemin conteneur</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="/path/in/container" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="readOnly"
                    render={({ field }) => (
                        <FormItem>
                            <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                <div className="flex flex-col">
                                    <span>Lecture seule</span>
                                    <FormDescription className="text-xs">
                                        Le volume sera monté en lecture seule
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </Label>
                        </FormItem>
                    )}
                />

                <DialogFooter className="flex !justify-between pt-4">
                    <div className="flex flex-1 flex-row justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button
                            className="flex-1 sm:flex-0"
                            type="submit"
                            disabled={!form.formState.isDirty}
                            icon={Plus}
                        >
                            Ajouter
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
}
