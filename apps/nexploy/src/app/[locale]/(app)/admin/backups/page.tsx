import { Database, HardDrive } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { kyDocker } from '@/lib/api/kyDocker';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { formatBytes } from '@/utils/formatBytes';
import { getAllBucketStorageAccounts } from '@/services/bucketStorage.service';
import { getBackupSchedulesForVolumes } from '@/services/backupSchedule.service';
import { VolumeBucketStorageButton } from '@/components/admin/backups/VolumeBucketStorageButton';
import { VolumeExportButton } from '@/components/admin/backups/VolumeExportButton';
import { Can } from '@/components/permission/Can';
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
                    <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Database className="size-7 text-primary" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="break-all font-semibold text-3xl tracking-tight">{t('backups')}</h1>
                        <p className="text-muted-foreground text-sm">{t('manageBackupsDescription')}</p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        {volumes.length === 0 ? (
                            <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
                                {t('noVolumesAvailable')}
                            </div>
                        ) : (
                            <>
                                <SchedulesAccordion volumeSchedules={volumeSchedules} />
                                <div className="overflow-hidden rounded-md border bg-card shadow-sm">
                                    {volumes.map((volume, index) => (
                                        <div
                                            key={volume.name}
                                            className={`flex items-center justify-between gap-2 px-4 py-3 ${
                                                index < volumes.length - 1 ? 'border-b' : ''
                                            }`}
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                                    <HardDrive className="size-4 text-primary" />
                                                </div>
                                                <div className="flex min-w-0 flex-1 flex-col break-all">
                                                    <span className="font-medium text-sm">{volume.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {volume.driver}
                                                        {volume.usageData?.Size != null &&
                                                            ` · ${formatBytes(volume.usageData.Size)}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Can resource="backup" action="create">
                                                    <VolumeExportButton volumeName={volume.name} />
                                                </Can>
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
