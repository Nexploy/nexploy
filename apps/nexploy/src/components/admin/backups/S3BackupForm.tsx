'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { S3AccountInfo } from '@workspace/typescript-interface/s3/s3';
import { UploadNowTab } from '@/components/admin/backups/UploadNowTab';
import { ScheduleTab } from '@/components/admin/backups/ScheduleTab';

interface S3BackupContentProps {
    volumeName: string;
    s3Accounts: S3AccountInfo[];
}

export function S3BackupForm({ volumeName, s3Accounts }: S3BackupContentProps) {
    const t = useTranslations('admin');

    return (
        <Tabs defaultValue="now">
            <TabsList className="w-full">
                <TabsTrigger value="now" className="flex-1">
                    {t('uploadNow')}
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1">
                    {t('scheduleBackup')}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="now">
                <UploadNowTab volumeName={volumeName} s3Accounts={s3Accounts} />
            </TabsContent>

            <TabsContent value="schedule">
                <ScheduleTab volumeName={volumeName} s3Accounts={s3Accounts} />
            </TabsContent>
        </Tabs>
    );
}
