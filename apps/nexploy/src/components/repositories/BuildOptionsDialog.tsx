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
import { useTranslations } from 'next-intl';

const buildOptionsSchema = z.object({
    commitHash: z.string().optional(),
});

type BuildOptionsForm = z.infer<typeof buildOptionsSchema>;

interface BuildOptionsDialogProps {
    onSubmit: (data: BuildOptionsForm) => void;
}

export function BuildOptionsDialog({ onSubmit }: BuildOptionsDialogProps) {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('repository.builds');
    const tCommon = useTranslations('common');

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
                            <FormLabel>{t('commitHash')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={t('commitHashPlaceholder')}
                                    className="font-mono text-sm"
                                />
                            </FormControl>
                            <FormDescription>{t('commitHashDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            {tCommon('cancel')}
                        </Button>
                    </DialogClose>
                    <Button type="submit">
                        <Rocket className="size-4" />
                        {t('startBuild')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
