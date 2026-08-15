'use client';

import { useTranslations } from 'next-intl';
import { FileCog } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@workspace/ui/components/resizable';
import { useTraefikConfigStore } from '@/stores/traefik/useTraefikConfigStore';
import { TraefikFileList } from './TraefikFileList';
import { TraefikEditorPanel } from './TraefikEditorPanel';

export function TraefikConfigPage() {
    const t = useTranslations('admin.traefik');
    const { selectedFile } = useTraefikConfigStore();

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div className="flex gap-3 px-5">
                    <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileCog className="size-7 text-primary" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>
                <div className="mx-5 mb-5 flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
                    <ResizablePanelGroup>
                        <ResizablePanel defaultSize={200} minSize={200} maxSize={300}>
                            <TraefikFileList />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel>
                            {selectedFile ? (
                                <TraefikEditorPanel />
                            ) : (
                                <p className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    {t('selectFile')}
                                </p>
                            )}
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </div>
        </div>
    );
}
