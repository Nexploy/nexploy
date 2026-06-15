'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    type CollisionDetection,
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    pointerWithin,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { FileCode2, FilePlus2, Folder } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { TreeProvider } from '@workspace/ui/components/kibo-ui/tree';
import { Button } from '@workspace/ui/components/button.tsx';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import { buildPathMap, collectFolderPaths } from '@/lib/traefik/treeOps';
import { TraefikTreeNodes } from './TraefikTreeNodes';
import { canDropInto, ROOT_DROP_ID } from './traefikDnd';
import { TraefikNewFileDialog } from '@/components/admin/traefik/TraefikNewFileDialog.tsx';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore.ts';

const collisionDetection: CollisionDetection = (args) => {
    const collisions = pointerWithin(args);
    const nonRoot = collisions.filter((c) => c.id !== ROOT_DROP_ID);
    return nonRoot.length ? nonRoot : collisions;
};

function RootDropZone({ children }: { children: React.ReactNode }) {
    const { setNodeRef, isOver, active } = useDroppable({ id: ROOT_DROP_ID });
    const highlight = isOver && canDropInto(active?.id as string | undefined, '');

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'my-1 min-h-full rounded-md',
                highlight && 'bg-primary/5 ring-primary/40 ring-1 ring-inset',
            )}
        >
            {children}
        </div>
    );
}

export function TraefikFileList() {
    const t = useTranslations('admin.traefik');
    const { tree, selectedFile, afterNewFile, selectFile, moveEntry } = useTraefikConfigStore();
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const [activePath, setActivePath] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

    const onDragStart = (e: DragStartEvent) => setActivePath(String(e.active.id));

    const onDragEnd = (e: DragEndEvent) => {
        const source = String(e.active.id);
        const overId = e.over ? String(e.over.id) : null;
        setActivePath(null);
        if (!overId) return;
        const destDir = overId === ROOT_DROP_ID ? '' : overId;
        if (canDropInto(source, destDir)) moveEntry(source, destDir, t);
    };

    const activeNode = activePath ? pathMap.get(activePath) : undefined;

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
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragCancel={() => setActivePath(null)}
            >
                <ScrollAreaWithShadow
                    bottomShadow
                    colorShadow={'from-card via-card/50'}
                    className={'h-full overflow-hidden'}
                >
                    <RootDropZone>
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
                    </RootDropZone>
                </ScrollAreaWithShadow>

                <DragOverlay dropAnimation={null}>
                    {activeNode ? (
                        <div className="bg-card text-foreground flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md">
                            {activeNode.type === 'folder' ? (
                                <Folder className="size-3.5 shrink-0 opacity-70" />
                            ) : (
                                <FileCode2 className="size-3.5 shrink-0 opacity-70" />
                            )}
                            {activeNode.name}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
