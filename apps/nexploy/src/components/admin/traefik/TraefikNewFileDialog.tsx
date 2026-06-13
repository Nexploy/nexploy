'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { toast } from 'sonner';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

export function TraefikNewFileDialog() {
    const { onSuccess, closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('admin.traefik');
    const [fileName, setFileName] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        const trimmed = fileName.trim();
        const name = trimmed.endsWith('.yml') ? trimmed : `${trimmed}.yml`;

        if (!trimmed || !/^[\w.-]+$/.test(trimmed.replace(/\.yml$/, ''))) {
            toast.error(t('invalidFilename'));
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/admin/traefik', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: name, content: '' }),
            });

            if (res.status === 409) {
                toast.error(t('fileAlreadyExists'));
                return;
            }
            if (!res.ok) throw new Error();

            toast.success(t('createdSuccess'));
            if (onSuccess) onSuccess(name);
        } catch {
            toast.error(t('createError'));
        } finally {
            setCreating(false);
        }
    };

    const isInvalid = !!fileName && !/^[\w.-]+$/.test(fileName.replace(/\.yml$/, ''));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="traefik-filename">{t('filename')}</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="traefik-filename"
                        placeholder="my-config"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreate()}
                        autoFocus
                    />
                    <span className="text-muted-foreground shrink-0 text-sm">.yml</span>
                </div>
                {isInvalid && (
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle className="text-destructive size-3.5" />
                        <span className="text-destructive text-xs">{t('invalidFilenameHint')}</span>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={creating}>
                    {t('cancel')}
                </Button>
                <Button onClick={handleCreate} disabled={creating || !fileName.trim() || isInvalid}>
                    {creating && <Loader2 className="size-4 animate-spin" />}
                    {t('create')}
                </Button>
            </DialogFooter>
        </div>
    );
}
