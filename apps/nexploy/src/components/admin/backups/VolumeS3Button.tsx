'use client';

import { useTranslations } from 'next-intl';
import { CloudBackup } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { S3BackupForm } from '@/components/admin/backups/S3BackupForm';
import { S3AccountInfo } from '@workspace/typescript-interface/s3/s3';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface VolumeS3ButtonProps {
    volumeName: string;
    s3Accounts: S3AccountInfo[];
}

export function VolumeS3Button({ volumeName, s3Accounts }: VolumeS3ButtonProps) {
    const t = useTranslations('admin');
    const { openDialog } = useConfirmationDialogStore();

    const handleClick = () => {
        openDialog({
            title: t('uploadToS3'),
            description: volumeName,
            props: { className: 'sm:max-w-[480px]' },
            content: <S3BackupForm volumeName={volumeName} s3Accounts={s3Accounts} />,
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
                        disabled={s3Accounts.length === 0}
                    >
                        {t('uploadToS3')}
                    </Button>
                </div>
            </TooltipTrigger>
            {s3Accounts.length === 0 && <TooltipContent>{t('noS3Accounts')}</TooltipContent>}
        </Tooltip>
    );
}
