'use client';

import { useTranslations } from 'next-intl';
import { FilePlus2, Waypoints } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import { TraefikFileList } from './TraefikFileList';
import { TraefikEditorPanel } from './TraefikEditorPanel';
import { TraefikNewFileDialog } from './TraefikNewFileDialog';

export function TraefikConfigPage() {
    const t = useTranslations('admin.traefik');
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const { selectedFile, afterNewFile } = useTraefikConfigStore();

    const handleNewFile = () => {
        openDialog({
            title: t('newFileTitle'),
            description: t('newFileDescription'),
            content: <TraefikNewFileDialog />,
            onSuccess: async (name: string) => {
                await afterNewFile(name);
                closeDialog();
            },
        });
    };

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-start justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Waypoints className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {t('title')}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex shrink-0 items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleNewFile}>
                            <FilePlus2 className="size-4" />
                            {t('newFile')}
                        </Button>
                    </div>
                </div>

                <div className="bg-card border-border mx-5 mb-5 flex flex-1 overflow-hidden rounded-lg border shadow-sm">
                    <TraefikFileList />

                    {selectedFile ? (
                        <TraefikEditorPanel />
                    ) : (
                        <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
                            {t('selectFile')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
