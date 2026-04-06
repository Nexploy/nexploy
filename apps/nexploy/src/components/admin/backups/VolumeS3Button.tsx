'use client';

import { useTranslations } from 'next-intl';
import { CloudBackup } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { S3BackupForm } from '@/components/admin/backups/S3BackupForm';
import { AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { BackupSchedule } from 'generated/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface VolumeS3ButtonProps {
    volumeName: string;
    awsAccounts: AwsAccountInfo[];
    initialSchedules: BackupSchedule[];
}

export function VolumeS3Button({ volumeName, awsAccounts, initialSchedules }: VolumeS3ButtonProps) {
    const t = useTranslations('admin');
    const { openDialog } = useConfirmationDialogStore();

    const handleClick = () => {
        openDialog({
            closeOnBackground: true,
            title: t('uploadToS3'),
            description: volumeName,
            props: { className: 'sm:max-w-[480px]' },
            content: (
                <S3BackupForm
                    volumeName={volumeName}
                    awsAccounts={awsAccounts}
                    initialSchedules={initialSchedules}
                />
            ),
        });
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClick}
                        icon={CloudBackup}
                        disabled={awsAccounts.length === 0}
                    >
                        {t('uploadToS3')}
                    </Button>
                </div>
            </TooltipTrigger>
            {awsAccounts.length === 0 && <TooltipContent>{t('noAwsAccounts')}</TooltipContent>}
        </Tooltip>
    );
}
