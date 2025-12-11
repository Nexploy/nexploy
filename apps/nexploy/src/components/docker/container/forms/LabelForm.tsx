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
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogClose, DialogFooter } from '@workspace/ui/components/dialog';
import { Plus, Save, Trash } from 'lucide-react';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import {
    ContainerLabelForm,
    containerLabelSchema,
} from '@workspace/schemas-zod/docker/container/containerLabel.schema';

type Label = { key: string; value: string };

interface LabelFormProps {
    mode: 'add' | 'edit';
    defaultLabel?: Label;
    originalLabel?: Label;
}

export function LabelForm({ mode, defaultLabel, originalLabel }: LabelFormProps) {
    const { closeDialog } = useConfirmationDialogStore();
    const { onLabelChange } = useContainerChangesStore();

    const form = useForm<ContainerLabelForm>({
        resolver: zodResolver(containerLabelSchema),
        defaultValues: {
            key: defaultLabel?.key ?? '',
            value: defaultLabel?.value ?? '',
        },
    });

    const onSubmit = (data: ContainerLabelForm) => {
        if (mode === 'add') {
            onLabelChange({
                typeAction: 'add',
                key: data.key,
                value: data.value,
            });
        } else if (mode === 'edit') {
            const referenceLabel = originalLabel ?? defaultLabel;

            onLabelChange({
                typeAction: 'edit',
                key: data.key,
                value: data.value,
                currentKey: referenceLabel?.key,
                currentValue: referenceLabel?.value,
            });
        }

        closeDialog();
    };

    const handleDelete = () => {
        if (!defaultLabel) return;
        const referenceLabel = originalLabel ?? defaultLabel;

        onLabelChange({
            typeAction: 'delete',
            currentKey: referenceLabel?.key,
            currentValue: referenceLabel?.value,
        });

        closeDialog();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Clé</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="com.example.label" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valeur</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="value" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="flex !justify-between pt-4">
                    {mode === 'edit' && (
                        <Button
                            size="icon"
                            type="button"
                            variant="destructive"
                            icon={Trash}
                            onClick={handleDelete}
                        />
                    )}
                    <div className="flex flex-1 flex-row justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button
                            className="flex-1 sm:flex-0"
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
