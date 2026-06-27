'use client';

import { useTranslations } from 'next-intl';
import { CloudBackup } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { BucketStorageBackupForm } from '@/components/admin/backups/BucketStorageBackupForm';
import { BucketStorageAccountInfo } from '@workspace/typescript-interface/bucket-storage/bucketStorage';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface VolumeBucketStorageButtonProps {
    volumeName: string;
    bucketStorageAccounts: BucketStorageAccountInfo[];
}

export function VolumeBucketStorageButton({ volumeName, bucketStorageAccounts }: VolumeBucketStorageButtonProps) {
    const t = useTranslations('admin');
    const { openDialog } = useConfirmationDialogStore();

    const handleClick = () => {
        openDialog({
            title: t('uploadToBucketStorage'),
            description: volumeName,
            props: { className: 'sm:max-w-[480px]' },
            content: <BucketStorageBackupForm volumeName={volumeName} bucketStorageAccounts={bucketStorageAccounts} />,
        });
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div>
                    <Button
                        variant="outline"
                        onClick={handleClick}
                        icon={CloudBackup}
                        disabled={bucketStorageAccounts.length === 0}
                    >
                        {t('uploadToBucketStorage')}
                    </Button>
                </div>
            </TooltipTrigger>
            {bucketStorageAccounts.length === 0 && <TooltipContent>{t('noBucketStorageAccounts')}</TooltipContent>}
        </Tooltip>
    );
}
