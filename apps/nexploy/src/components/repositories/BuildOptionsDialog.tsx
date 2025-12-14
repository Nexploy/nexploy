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
import { Rocket } from 'lucide-react';
import { z } from 'zod';

const buildOptionsSchema = z.object({
    commitHash: z.string().optional(),
});

type BuildOptionsForm = z.infer<typeof buildOptionsSchema>;

interface BuildOptionsDialogProps {
    onSubmit: (data: BuildOptionsForm) => void;
}

export function BuildOptionsDialog({ onSubmit }: BuildOptionsDialogProps) {
    const { closeDialog } = useConfirmationDialogStore();

    const form = useForm<BuildOptionsForm>({
        resolver: zodResolver(buildOptionsSchema),
        defaultValues: {
            commitHash: '',
        },
    });

    const handleSubmit = (data: BuildOptionsForm) => {
        onSubmit(data);
        closeDialog();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="commitHash"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Commit Hash (optionnel)</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="abc123..."
                                    className="font-mono text-sm"
                                />
                            </FormControl>
                            <FormDescription>
                                Laissez vide pour builder le dernier commit de la branche
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Annuler
                        </Button>
                    </DialogClose>
                    <Button type="submit">
                        <Rocket className="size-4" />
                        Lancer le build
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
