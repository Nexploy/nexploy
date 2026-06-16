'use client';

import { FileCode2, FilePlus2, Folder, Trash2 } from 'lucide-react';
import {
    TreeExpander,
    TreeIcon,
    TreeLabel,
    TreeNode,
    TreeNodeContent,
    TreeNodeTrigger,
} from '@workspace/ui/components/kibo-ui/tree';
import { cn } from '@workspace/ui/lib/utils';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import type { TraefikTreeNode } from '@/lib/traefik/types';
import { TraefikNewFileDialog } from './TraefikNewFileDialog';
import { canDropInto } from './traefikDnd';
import { useTraefikDnd } from './traefikDndContext';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button.tsx';

export function TraefikTreeNodes({
    nodes,
    level,
    parentPath,
}: {
    nodes: TraefikTreeNode[];
    level: number;
    parentPath: boolean[];
}) {
    return (
        <>
            {nodes.map((node, index) => (
                <TraefikTreeRow
                    key={node.path}
                    node={node}
                    level={level}
                    parentPath={parentPath}
                    isLast={index === nodes.length - 1}
                />
            ))}
        </>
    );
}

function TraefikTreeRow({
    node,
    level,
    parentPath,
    isLast,
}: {
    node: TraefikTreeNode;
    level: number;
    parentPath: boolean[];
    isLast: boolean;
}) {
    const t = useTranslations('admin.traefik');
    const { selectedFile, isDirty, deleteFile, afterNewFile } = useTraefikConfigStore();
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const { activePath, dropTarget, setActivePath, setDropTarget, moveInto } = useTraefikDnd();

    const isFolder = node.type === 'folder';
    const hasChildren = isFolder && (node.children?.length ?? 0) > 0;

    const isDragging = activePath === node.path;
    const isDropTarget = isFolder && dropTarget === node.path && canDropInto(activePath, node.path);

    const handleDragStart = (e: React.DragEvent) => {
        setActivePath(node.path);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.path);
    };

    const handleDragEnd = () => {
        setActivePath(null);
        setDropTarget(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!isFolder || !canDropInto(activePath, node.path)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (dropTarget !== node.path) setDropTarget(node.path);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!isFolder) return;
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        if (dropTarget === node.path) setDropTarget(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isFolder || !canDropInto(activePath, node.path)) return;
        e.preventDefault();
        e.stopPropagation();
        moveInto(node.path);
        setDropTarget(null);
    };

    const handleNewFileInFolder = (folderPath: string) => {
        openDialog({
            title: t('newFileTitle'),
            description: t('newFileDescription'),
            content: <TraefikNewFileDialog baseDir={folderPath} />,
            onSuccess: async (name: string) => {
                await afterNewFile(name);
                closeDialog();
            },
        });
    };

    return (
        <TreeNode nodeId={node.path} level={level} isLast={isLast} parentPath={parentPath}>
            <div
                onDragOver={isFolder ? handleDragOver : undefined}
                onDragLeave={isFolder ? handleDragLeave : undefined}
                onDrop={isFolder ? handleDrop : undefined}
            >
                <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <TreeNodeTrigger
                        className={cn(
                            'px-2 py-1',
                            isDragging && 'opacity-50',
                            isDropTarget && 'bg-primary/10 ring-primary/40 ring-1 ring-inset',
                        )}
                    >
                        <TreeExpander hasChildren={hasChildren} />
                        <TreeIcon
                            hasChildren={hasChildren}
                            icon={
                                isFolder ? (
                                    <Folder className="size-3.5 shrink-0 opacity-70" />
                                ) : (
                                    <FileCode2 className="size-3.5 shrink-0 opacity-70" />
                                )
                            }
                        />
                        <TreeLabel className="text-xs">{node.name}</TreeLabel>
                        {isFolder && (
                            <Button
                                size={'icon'}
                                variant={'ghost'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNewFileInFolder(node.path);
                                }}
                                className="text-muted-foreground hover:text-primary size-5 shrink-0 rounded-sm opacity-0 transition-opacity group-hover:opacity-100"
                                title={t('newFile')}
                            >
                                <FilePlus2 className="size-3" />
                            </Button>
                        )}
                        {node.type === 'file' && (
                            <>
                                {selectedFile === node.path && isDirty() && (
                                    <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                                )}
                                <Button
                                    size={'icon'}
                                    variant={'ghost'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteFile(t, node.path);
                                    }}
                                    className="text-muted-foreground hover:text-destructive size-5 shrink-0 rounded-sm opacity-0 transition-opacity group-hover:opacity-100"
                                    title={t('delete')}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            </>
                        )}
                    </TreeNodeTrigger>
                </div>
            </div>
            {hasChildren && (
                <TreeNodeContent hasChildren>
                    <TraefikTreeNodes
                        nodes={node.children ?? []}
                        level={level + 1}
                        parentPath={[...parentPath, isLast]}
                    />
                </TreeNodeContent>
            )}
        </TreeNode>
    );
}
