'use client';

import { useTranslations } from 'next-intl';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { Button } from '@workspace/ui/components/button';
import { Download, HardDrive } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';

export function VolumesBackupList() {
    const t = useTranslations('admin');
    const volumes = useVolumeStore((state) => state.volumes);

    const handleDownload = (volumeName: string) => {
        window.location.href = `/api/backup/download?volume=${encodeURIComponent(volumeName)}`;
    };

    if (volumes.length === 0) {
        return (
            <div className="text-muted-foreground py-12 text-center text-sm">
                {t('noVolumesAvailable')}
            </div>
        );
    }

    return (
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
                            <HardDrive className="text-muted-foreground size-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{volume.name}</span>
                            <span className="text-muted-foreground text-xs">
                                {volume.driver}
                                {volume.usageData?.Size != null &&
                                    ` · ${formatBytes(volume.usageData.Size)}`}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(volume.name)}
                    >
                        <Download className="size-4" />
                        {t('downloadBackup')}
                    </Button>
                </div>
            ))}
        </div>
    );
}
