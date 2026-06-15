'use client';

import { useTranslations } from 'next-intl';
import { FileCode2, Folder, Trash2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tree, TreeItem } from '@workspace/ui/components/tree';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import type { TraefikTreeNode } from '@/lib/traefik/types';
import type { TranslationFunction } from '@workspace/typescript-interface/commun.ts';

/** Collect every folder path so the tree starts fully expanded. */
function collectFolderPaths(nodes: TraefikTreeNode[], acc: string[] = []): string[] {
    for (const node of nodes) {
        if (node.type === 'folder') {
            acc.push(node.path);
            if (node.children) collectFolderPaths(node.children, acc);
        }
    }
    return acc;
}

function TraefikTreeNodes({ nodes, t }: { nodes: TraefikTreeNode[]; t: TranslationFunction }) {
    const { selectedFile, isDirty, selectFile, deleteFile } = useTraefikConfigStore();

    return (
        <>
            {nodes.map((node) =>
                node.type === 'folder' ? (
                    <TreeItem
                        key={node.path}
                        value={node.path}
                        label={node.name}
                        icon={<Folder className="size-3.5 shrink-0 opacity-70" />}
                    >
                        {node.children && node.children.length > 0 ? (
                            <TraefikTreeNodes nodes={node.children} t={t} />
                        ) : null}
                    </TreeItem>
                ) : (
                    <TreeItem
                        key={node.path}
                        value={node.path}
                        label={node.name}
                        icon={<FileCode2 className="size-3.5 shrink-0 opacity-70" />}
                        onSelect={() => selectFile(node.path, t)}
                        actions={
                            <>
                                {selectedFile === node.path && isDirty() && (
                                    <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteFile(t, node.path);
                                    }}
                                    className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover/tree-item:opacity-100"
                                    title={t('delete')}
                                >
                                    <Trash2 className="size-3" />
                                </button>
                            </>
                        }
                    />
                ),
            )}
        </>
    );
}

export function TraefikFileList() {
    const t = useTranslations('admin.traefik');
    const { tree, filesLoading, selectedFile } = useTraefikConfigStore();

    return (
        <div className="border-border flex w-[20%] min-w-[150px] shrink-0 flex-col border-r">
            <div className="border-border flex h-9 items-center justify-between border-b px-3">
                <span className="text-muted-foreground text-xs">{t('files')}</span>
            </div>
            <ScrollAreaWithShadow className="flex-1">
                <div className="p-1.5">
                    {filesLoading ? (
                        <div className="space-y-1 p-1">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-6 w-full" />
                            ))}
                        </div>
                    ) : tree.length === 0 ? (
                        <p className="text-muted-foreground px-2 py-4 text-center text-xs">
                            {t('noFiles')}
                        </p>
                    ) : (
                        <Tree value={selectedFile ?? undefined} defaultExpanded={collectFolderPaths(tree)}>
                            <TraefikTreeNodes nodes={tree} t={t} />
                        </Tree>
                    )}
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
