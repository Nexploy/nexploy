'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { UploadNowTab } from '@/components/admin/backups/UploadNowTab';
import { ScheduleTab } from '@/components/admin/backups/ScheduleTab';

interface S3BackupContentProps {
    volumeName: string;
    awsAccounts: AwsAccountInfo[];
}

export function S3BackupForm({ volumeName, awsAccounts }: S3BackupContentProps) {
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
                <UploadNowTab volumeName={volumeName} awsAccounts={awsAccounts} />
            </TabsContent>

            <TabsContent value="schedule">
                <ScheduleTab volumeName={volumeName} awsAccounts={awsAccounts} />
            </TabsContent>
        </Tabs>
    );
}
