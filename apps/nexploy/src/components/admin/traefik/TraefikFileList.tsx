'use client';

import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { TreeProvider } from '@workspace/ui/components/kibo-ui/tree';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import { buildPathMap, collectFolderPaths } from '@/lib/traefik/treeOps';
import { TraefikTreeNodes } from './TraefikTreeNodes';
import { Button } from '@workspace/ui/components/button.tsx';
import { FilePlus2 } from 'lucide-react';
import { TraefikNewFileDialog } from '@/components/admin/traefik/TraefikNewFileDialog.tsx';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore.ts';

export function TraefikFileList() {
    const t = useTranslations('admin.traefik');
    const { tree, selectedFile, afterNewFile, selectFile } = useTraefikConfigStore();
    const { openDialog, closeDialog } = useConfirmationDialogStore();

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
            <ScrollAreaWithShadow
                bottomShadow
                colorShadow={'from-card via-card/50'}
                className={'h-full overflow-hidden'}
            >
                <div className="my-1">
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
        </div>
    );
}
