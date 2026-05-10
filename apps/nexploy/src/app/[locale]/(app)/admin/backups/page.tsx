import { Database, HardDrive } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import { kyDocker } from '@/lib/api/kyDocker';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { formatBytes } from '@/utils/formatBytes';
import { getAllAwsAccounts } from '@/services/aws.service';
import { getBackupSchedulesForVolumes } from '@/services/backupSchedule.service';
import { VolumeS3Button } from '@/components/admin/backups/VolumeS3Button';
import { SchedulesAccordion } from '@/components/admin/backups/SchedulesAccordion';

export default async function BackupsPage() {
    const [t, volumes, awsAccounts] = await Promise.all([
        getTranslations('admin'),
        kyDocker.get('volumes').json<Volume[]>(),
        getAllAwsAccounts(),
    ]);

    const volumeSchedules = await getBackupSchedulesForVolumes(volumes.map((v) => v.name));

    if (volumes.length === 0) {
        return (
            <div className="text-muted-foreground py-12 text-center text-sm">
                {t('noVolumesAvailable')}
            </div>
        );
    }

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Database className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight break-all">
                            {t('backups')}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {t('manageBackupsDescription')}
                        </p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        <SchedulesAccordion volumeSchedules={volumeSchedules} />
                        <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                            {volumes.map((volume, index) => (
                                <div
                                    key={volume.name}
                                    className={`flex items-center justify-between px-4 py-3 ${
                                        index < volumes.length - 1 ? 'border-b' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
                                            <HardDrive className="text-primary size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {volume.name}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {volume.driver}
                                                {volume.usageData?.Size != null &&
                                                    ` · ${formatBytes(volume.usageData.Size)}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <VolumeS3Button
                                            volumeName={volume.name}
                                            awsAccounts={awsAccounts}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
