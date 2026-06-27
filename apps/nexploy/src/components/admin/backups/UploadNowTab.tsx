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
import { uploadVolumeToBucketStorageSchema } from '@workspace/schemas-zod/bucket-storage/bucketStorage.schema';
import { uploadVolumeToBucketStorageAction } from '@/actions/bucket-storage/uploadVolumeToBucketStorage.action';
import { BucketStorageAccountInfo } from '@workspace/typescript-interface/bucket-storage/bucketStorage';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface UploadNowTabProps {
    volumeName: string;
    bucketStorageAccounts: BucketStorageAccountInfo[];
}

export function UploadNowTab({ volumeName, bucketStorageAccounts }: UploadNowTabProps) {
    const t = useTranslations('admin');
    const { closeDialog } = useConfirmationDialogStore();

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        uploadVolumeToBucketStorageAction,
        zodResolver(uploadVolumeToBucketStorageSchema),
        {
            formProps: {
                defaultValues: {
                    volumeName,
                    bucket: '',
                    accountId: bucketStorageAccounts[0]?.id,
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
                            <FormLabel>{t('bucketStorageAccount')}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectBucketStorageAccount')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('bucketStorageAccount')}</SelectLabel>
                                        {bucketStorageAccounts.map((a) => (
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
                            <FormLabel>{t('bucketName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('bucketNamePlaceholder')} {...field} />
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
