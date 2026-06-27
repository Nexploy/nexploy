'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { BucketStorageAccountInfo } from '@workspace/typescript-interface/bucket-storage/bucketStorage';
import { UploadNowTab } from '@/components/admin/backups/UploadNowTab';
import { ScheduleTab } from '@/components/admin/backups/ScheduleTab';

interface BucketStorageBackupContentProps {
    volumeName: string;
    bucketStorageAccounts: BucketStorageAccountInfo[];
}

export function BucketStorageBackupForm({ volumeName, bucketStorageAccounts }: BucketStorageBackupContentProps) {
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
                <UploadNowTab volumeName={volumeName} bucketStorageAccounts={bucketStorageAccounts} />
            </TabsContent>

            <TabsContent value="schedule">
                <ScheduleTab volumeName={volumeName} bucketStorageAccounts={bucketStorageAccounts} />
            </TabsContent>
        </Tabs>
    );
}
