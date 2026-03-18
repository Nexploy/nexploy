'use client';

import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';

interface LogsToolbarProps {
    id: string;
    showTimestamp: boolean;
    onShowTimestampChange: (value: boolean) => void;
    hasLogs: boolean;
    onDownload: () => void;
    autoScroll: boolean;
    onAutoScrollToggle: () => void;
}

export function LogsToolbar({
    id,
    showTimestamp,
    onShowTimestampChange,
    hasLogs,
    onDownload,
    autoScroll,
    onAutoScrollToggle,
}: LogsToolbarProps) {
    const t = useTranslations('repository.builds.logs');

    return (
        <>
            <div className="flex items-center space-x-2">
                <Label htmlFor={id} className="cursor-pointer text-xs">
                    {t('showDate')}
                </Label>
                <Switch
                    id={id}
                    className="cursor-pointer"
                    onCheckedChange={onShowTimestampChange}
                    defaultChecked={showTimestamp}
                />
            </div>
            {hasLogs && (
                <Button size="sm" onClick={onDownload}>
                    <Download />
                    {t('download')}
                </Button>
            )}
            <Button
                size="sm"
                icon={autoScroll ? ArrowDown : ArrowUp}
                variant={autoScroll ? 'default' : 'white'}
                onClick={onAutoScrollToggle}
            >
                {autoScroll ? t('auto') : t('manual')}
            </Button>
        </>
    );
}
