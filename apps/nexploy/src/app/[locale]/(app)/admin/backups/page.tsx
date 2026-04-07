import { Database, Download, HardDrive } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import { kyDocker } from '@/lib/api/kyDocker';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { Button } from '@workspace/ui/components/button';
import { formatBytes } from '@/utils/formatBytes';
import { getAllAwsAccounts } from '@/services/aws.service';
import { getBackupSchedulesForVolume } from '@/services/backupSchedule.service';
import { VolumeS3Button } from '@/components/admin/backups/VolumeS3Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

export default async function BackupsPage() {
    const [t, volumes, awsAccounts] = await Promise.all([
        getTranslations('admin'),
        kyDocker.get('volumes').json<Volume[]>(),
        getAllAwsAccounts(),
    ]);

    const allSchedules = await Promise.all(
        volumes.map((volume) => getBackupSchedulesForVolume(volume.name)),
    );

    if (volumes.length === 0) {
        return (
            <div className="text-muted-foreground py-12 text-center text-sm">
                {t('noVolumesAvailable')}
            </div>
        );
    }
    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-4">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Database className="text-primary size-7" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('backups')}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {t('manageBackupsDescription')}
                        </p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="px-5 pb-5">
                        <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                            {volumes.map((volume, index) => (
                                <div
                                    key={volume.name}
                                    className={`flex items-center justify-between px-4 py-3 ${
                                        index < volumes.length - 1 ? 'border-b' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted flex size-8 items-center justify-center rounded-md">
                                            <HardDrive className="size-4" />
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
                                            initialSchedules={allSchedules[index] ?? []}
                                        />
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Button variant="outline" size="icon" asChild>
                                                    <a
                                                        href={`/api/backup/download?volume=${encodeURIComponent(volume.name)}`}
                                                        download
                                                    >
                                                        <Download className="size-4" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('downloadBackup')}</TooltipContent>
                                        </Tooltip>
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
