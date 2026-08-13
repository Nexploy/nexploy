'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';

interface VolumeExportButtonProps {
    volumeName: string;
}

export function VolumeExportButton({ volumeName }: VolumeExportButtonProps) {
    const t = useTranslations('admin');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const response = await fetch(`/api/backup/volumes/${encodeURIComponent(volumeName)}/download`);

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.message ?? t('exportVolumeError'));
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `${volumeName}-${Date.now()}.tar.gz`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            toast.success(t('exportVolumeSuccess'));
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : t('exportVolumeError'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleExport} icon={Download} disabled={isExporting} isLoading={isExporting}>
            {t('exportVolume')}
        </Button>
    );
}
