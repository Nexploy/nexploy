'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { DragAndDrop } from '@workspace/ui/components/drag-and-drop';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

const ARCHIVE_EXTENSIONS = ['.gz', '.tgz'];
const ARCHIVE_SUFFIX = /\.tar\.gz$|\.tgz$/;

export function ImportVolumeForm() {
    const t = useTranslations('docker.importVolumePage');
    const { closeDialog } = useConfirmationDialogStore();

    const [file, setFile] = useState<File | null>(null);
    const [volumeName, setVolumeName] = useState('');
    const [overwrite, setOverwrite] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (selected: File | null) => {
        setFile(selected);

        if (selected && !volumeName) {
            setVolumeName(selected.name.replace(ARCHIVE_SUFFIX, '').replace(/-\d{10,}$/, ''));
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!file) {
            toast.error(t('fileRequired'));
            return;
        }

        setIsImporting(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('volumeName', volumeName.trim());
        formData.append('overwrite', String(overwrite));

        try {
            const response = await fetch('/api/backup/volumes/import', { method: 'POST', body: formData });

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.message ?? t('importError'));
            }

            toast.success(t('importSuccess', { name: volumeName.trim() }));
            closeDialog();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : t('importError'));
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
                <Label>{t('archive')}</Label>
                <DragAndDrop
                    onFile={handleFileChange}
                    accept={ARCHIVE_EXTENSIONS}
                    dropText={t('dropZoneText')}
                    formatsText={t('archiveHint')}
                    disabled={isImporting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="volume-name">{t('volumeName')}</Label>
                <Input
                    id="volume-name"
                    value={volumeName}
                    onChange={(event) => setVolumeName(event.target.value)}
                    placeholder={t('volumeNamePlaceholder')}
                />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div className="flex flex-col">
                    <Label htmlFor="volume-overwrite">{t('overwrite')}</Label>
                    <span className="text-muted-foreground text-xs">{t('overwriteHint')}</span>
                </div>
                <Switch id="volume-overwrite" checked={overwrite} onCheckedChange={setOverwrite} />
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isImporting || !file || !volumeName.trim()} isLoading={isImporting}>
                    {t('import')}
                </Button>
            </DialogFooter>
        </form>
    );
}
