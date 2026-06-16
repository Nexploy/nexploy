'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilePlus2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { TreeProvider } from '@workspace/ui/components/kibo-ui/tree';
import { Button } from '@workspace/ui/components/button.tsx';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import { buildPathMap, collectFolderPaths } from '@/lib/traefik/treeOps';
import { TraefikTreeNodes } from './TraefikTreeNodes';
import { canDropInto } from './traefikDnd';
import { TraefikDndProvider } from './traefikDndContext';
import { TraefikNewFileDialog } from '@/components/admin/traefik/TraefikNewFileDialog.tsx';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore.ts';

export function TraefikFileList() {
    const t = useTranslations('admin.traefik');
    const { tree, selectedFile, afterNewFile, selectFile, moveEntry } = useTraefikConfigStore();
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const [activePath, setActivePath] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [rootOver, setRootOver] = useState(false);

    const pathMap = buildPathMap(tree);

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

    const moveInto = (destDir: string) => {
        if (activePath && canDropInto(activePath, destDir)) moveEntry(activePath, destDir, t);
        setActivePath(null);
        setDropTarget(null);
    };

    const rootHighlight = rootOver && canDropInto(activePath, '');

    const handleRootDragOver = (e: React.DragEvent) => {
        if (!canDropInto(activePath, '')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!rootOver) setRootOver(true);
    };

    const handleRootDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setRootOver(false);
    };

    const handleRootDrop = (e: React.DragEvent) => {
        if (dropTarget) return;
        if (!canDropInto(activePath, '')) return;
        e.preventDefault();
        moveInto('');
        setRootOver(false);
    };

    return (
        <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="border-border flex h-9 items-center justify-between border-b pr-1.5 pl-3">
                <span className="text-muted-foreground text-xs">{t('files')}</span>
                <Button
                    variant="outline"
                    size={'icon'}
                    className={'size-6'}
                    onClick={handleNewFile}
                >
                    <FilePlus2 className="size-3" />
                </Button>
            </div>
            <TraefikDndProvider
                value={{ activePath, dropTarget, setActivePath, setDropTarget, moveInto }}
            >
                <ScrollAreaWithShadow
                    bottomShadow
                    colorShadow={'from-card via-card/50'}
                    className={'h-full overflow-hidden'}
                >
                    <div
                        className={cn(
                            'my-1 min-h-full rounded-md',
                            rootHighlight && 'bg-primary/5 ring-primary/40 ring-1 ring-inset',
                        )}
                        onDragOver={handleRootDragOver}
                        onDragLeave={handleRootDragLeave}
                        onDrop={handleRootDrop}
                    >
                        {tree.length === 0 ? (
                            <p className="text-muted-foreground px-2 py-4 text-center text-xs">
                                {t('noFiles')}
                            </p>
                        ) : (
                            <TreeProvider
                                animateExpand={false}
                                indent={14}
                                defaultExpandedIds={collectFolderPaths(tree)}
                                selectedIds={selectedFile ? [selectedFile] : []}
                                onSelectionChange={(ids) => {
                                    const id = ids[0];
                                    if (id && pathMap.get(id)?.type === 'file') selectFile(id, t);
                                }}
                            >
                                <TraefikTreeNodes nodes={tree} level={0} parentPath={[]} />
                            </TreeProvider>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </TraefikDndProvider>
        </div>
    );
}
