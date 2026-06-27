'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { uploadVolumeToS3Schema } from '@workspace/schemas-zod/s3/s3.schema';
import { uploadVolumeToS3Action } from '@/actions/s3/uploadVolumeToS3.action';
import { S3AccountInfo } from '@workspace/typescript-interface/s3/s3';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface UploadNowTabProps {
    volumeName: string;
    s3Accounts: S3AccountInfo[];
}

export function UploadNowTab({ volumeName, s3Accounts }: UploadNowTabProps) {
    const t = useTranslations('admin');
    const { closeDialog } = useConfirmationDialogStore();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        uploadVolumeToS3Action,
        zodResolver(uploadVolumeToS3Schema),
        {
            formProps: {
                defaultValues: {
                    volumeName,
                    bucket: '',
                    accountId: s3Accounts[0]?.id,
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('backupUploadedSuccess'));
                    closeDialog();
                },
                onError: () => {
                    toast.error(t('backupFailed'));
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-3 pt-2">
                <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('s3Account')}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectS3Account')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('s3Account')}</SelectLabel>
                                        {s3Accounts.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.displayName} — {a.region}
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
                    name="bucket"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('s3BucketName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('s3BucketNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {t('uploadNow')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
