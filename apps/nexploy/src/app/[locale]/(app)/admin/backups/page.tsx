import { Database, HardDrive } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { kyDocker } from '@/lib/api/kyDocker';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { formatBytes } from '@/utils/formatBytes';
import { getAllBucketStorageAccounts } from '@/services/bucketStorage.service';
import { getBackupSchedulesForVolumes } from '@/services/backupSchedule.service';
import { VolumeBucketStorageButton } from '@/components/admin/backups/VolumeBucketStorageButton';
import { SchedulesAccordion } from '@/components/admin/backups/SchedulesAccordion';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';

export default async function BackupsPage() {
    const [t, volumes, bucketStorageAccounts] = await Promise.all([
        getTranslations('admin'),
        kyDocker.get('volumes').json<Volume[]>(),
        getAllBucketStorageAccounts(),
    ]);

    const volumeSchedules = await getBackupSchedulesForVolumes(volumes.map((v) => v.name));

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex h-full flex-col gap-4">
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
                        {volumes.length === 0 ? (
                            <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
                                {t('noVolumesAvailable')}
                            </div>
                        ) : (
                            <>
                                <SchedulesAccordion volumeSchedules={volumeSchedules} />
                                <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                                    {volumes.map((volume, index) => (
                                        <div
                                            key={volume.name}
                                            className={`flex items-center justify-between gap-2 px-4 py-3 ${
                                                index < volumes.length - 1 ? 'border-b' : ''
                                            }`}
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-md">
                                                    <HardDrive className="text-primary size-4" />
                                                </div>
                                                <div className="flex min-w-0 flex-1 flex-col break-all">
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
                                            <div className="flex shrink-0 items-center gap-2">
                                                <VolumeBucketStorageButton
                                                    volumeName={volume.name}
                                                    bucketStorageAccounts={bucketStorageAccounts}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
