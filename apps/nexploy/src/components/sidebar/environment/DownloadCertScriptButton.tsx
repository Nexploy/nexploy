'use client';

import { Button } from '@workspace/ui/components/button';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildCertScript } from './buildCertScript';

interface DownloadCertScriptButtonProps {
    disabled?: boolean;
    host?: string;
}

export function DownloadCertScriptButton({ disabled, host }: DownloadCertScriptButtonProps) {
    const t = useTranslations('docker.environmentForm');

    const handleDownload = () => {
        if (!host) return;

        const script = buildCertScript(host);
        const blob = new Blob([script], { type: 'text/x-sh' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generate-docker-certs-${host}.sh`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={disabled}
            className="h-7 gap-1.5 text-xs"
        >
            <Download className="h-3.5 w-3.5" />
            {t('downloadCertScript')}
        </Button>
    );
}
