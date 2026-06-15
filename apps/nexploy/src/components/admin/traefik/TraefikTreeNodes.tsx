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
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import type { TraefikTreeNode } from '@/lib/traefik/types';
import { TraefikNewFileDialog } from './TraefikNewFileDialog';
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
    const t = useTranslations('admin.traefik');

    const { selectedFile, isDirty, deleteFile, afterNewFile } = useTraefikConfigStore();
    const { openDialog, closeDialog } = useConfirmationDialogStore();

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
        <>
            {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                const hasChildren = node.type === 'folder' && (node.children?.length ?? 0) > 0;

                return (
                    <TreeNode
                        key={node.path}
                        nodeId={node.path}
                        level={level}
                        isLast={isLast}
                        parentPath={parentPath}
                    >
                        <TreeNodeTrigger className="px-2 py-1">
                            <TreeExpander hasChildren={hasChildren} />
                            <TreeIcon
                                hasChildren={hasChildren}
                                icon={
                                    node.type === 'folder' ? (
                                        <Folder className="size-3.5 shrink-0 opacity-70" />
                                    ) : (
                                        <FileCode2 className="size-3.5 shrink-0 opacity-70" />
                                    )
                                }
                            />
                            <TreeLabel className="text-xs">{node.name}</TreeLabel>
                            {node.type === 'folder' && (
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
            })}
        </>
    );
}
