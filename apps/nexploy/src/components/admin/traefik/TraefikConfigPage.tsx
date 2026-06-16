'use client';

import { useTranslations } from 'next-intl';
import { Waypoints } from 'lucide-react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@workspace/ui/components/resizable';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import { TraefikFileList } from './TraefikFileList';
import { TraefikEditorPanel } from './TraefikEditorPanel';

export function TraefikConfigPage() {
    const t = useTranslations('admin.traefik');
    const { selectedFile } = useTraefikConfigStore();

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div className="flex gap-3 px-5">
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
                <div className="bg-card mx-5 mb-5 flex min-h-0 flex-1 overflow-hidden rounded-lg border shadow-sm">
                    <ResizablePanelGroup>
                        <ResizablePanel defaultSize={200} minSize={200} maxSize={300}>
                            <TraefikFileList />
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel>
                            {selectedFile ? (
                                <TraefikEditorPanel />
                            ) : (
                                <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
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
