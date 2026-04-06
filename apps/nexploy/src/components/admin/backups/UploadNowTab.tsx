'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
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
import { uploadVolumeToS3Schema } from '@workspace/schemas-zod/aws/aws.schema';
import { uploadVolumeToS3Action } from '@/actions/aws/uploadVolumeToS3.action';
import { AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface UploadNowTabProps {
    volumeName: string;
    awsAccounts: AwsAccountInfo[];
}

export function UploadNowTab({ volumeName, awsAccounts }: UploadNowTabProps) {
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
                    accountId: awsAccounts[0]?.id,
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('backupUploadedSuccess'));
                    closeDialog();
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? t('backupFailed'));
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
                            <FormLabel>{t('awsAccount')}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectAwsAccount')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('awsAccount')}</SelectLabel>
                                        {awsAccounts.map((a) => (
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
                        <Upload className="size-4" />
                        {t('uploadNow')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
