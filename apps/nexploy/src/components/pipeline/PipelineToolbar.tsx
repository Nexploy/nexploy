'use client';

import {
    Check,
    Copy,
    GitBranch,
    Loader2,
    Power,
    Redo2,
    Settings,
    SquareDashed,
    Trash2,
    Undo2,
    X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Kbd } from '@workspace/ui/components/kbd';
import { useStore } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import { StatusLive } from '@/components/shared/StatusLive';

const mod = /Mac|iPhone|iPad/i.test(navigator.userAgent) ? '⌘' : 'Ctrl';

export function PipelineToolbar() {
    const t = useTranslations('repository.pipeline');
    const {
        isSaving,
        nodes,
        selectedNodeIds,
        undo,
        redo,
        canUndo,
        canRedo,
        handleDeleteSelection,
        handleDuplicateSelection,
        openDialogSettingNode,
        setNodes,
        triggerAutoSave,
        activeBuildId,
        activeBuild,
        setActiveBuildId,
        isViewingBuild,
    } = usePipelineContext();

    const addSelectedNodes = useStore((s) => s.addSelectedNodes);

    const disabledCount = nodes.filter((n) => n.data.disabled).length;
    const hasSelection = selectedNodeIds.length > 0;

    const handleSelectAll = () => {
        addSelectedNodes(nodes.map((n) => n.id));
    };

    const handleToggleDisable = () => {
        const selected = nodes.filter((n) => n.selected);
        if (selected.length === 0) return;
        const allDisabled = selected.every((n) => n.data.disabled);
        const selectedIds = new Set(selected.map((n) => n.id));
        setNodes((prev) =>
            prev.map((n) =>
                selectedIds.has(n.id) ? { ...n, data: { ...n.data, disabled: !allDisabled } } : n,
            ),
        );
        triggerAutoSave();
    };

    return (
        <div className="mx-5 flex items-center justify-between gap-2 rounded-t-md border border-b-0 px-2 py-1">
            <div className={'flex items-center gap-1'}>
                <div className={'flex items-center gap-1 pr-1'}>
                    <span className="text-muted-foreground text-xs">
                        {t('nodeCount', { count: nodes.length })}
                    </span>
                    {disabledCount > 0 && (
                        <>
                            <span className={'text-muted-foreground text-base'}>·</span>
                            <span className="text-muted-foreground/60 text-xs">
                                {t('disabledCount', { count: disabledCount })}
                            </span>
                        </>
                    )}
                </div>
                <Separator orientation="vertical" className="!h-4" />
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={undo}
                                    disabled={!canUndo || isViewingBuild}
                                >
                                    <Undo2 className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex items-center gap-1.5">
                                {t('undo')}
                                <Kbd>{mod} + Z</Kbd>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={redo}
                                    disabled={!canRedo || isViewingBuild}
                                >
                                    <Redo2 className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex items-center gap-1.5">
                                {t('redo')}
                                <Kbd>{mod} + ⇧ + Z</Kbd>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Separator orientation="vertical" className="!h-4" />
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={handleSelectAll}
                                    disabled={isViewingBuild}
                                >
                                    <SquareDashed className={'size-3'} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex items-center gap-1.5">
                                {t('shortcutsList.selectAll')} <Kbd>{mod} + A</Kbd>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={handleDuplicateSelection}
                                    disabled={!hasSelection || isViewingBuild}
                                >
                                    <Copy className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex items-center gap-1.5">
                                {t('shortcutsList.duplicate')} <Kbd>{mod} + D</Kbd>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={handleToggleDisable}
                                    disabled={!hasSelection || isViewingBuild}
                                >
                                    <Power className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex items-center gap-1.5">
                                {t('shortcutsList.toggleDisable')} <Kbd>D</Kbd>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:text-destructive size-6"
                                    onClick={handleDeleteSelection}
                                    disabled={!hasSelection || isViewingBuild}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex items-center gap-1.5">
                                {t('shortcutsList.delete')} <Kbd>Del</Kbd>
                            </TooltipContent>
                        </Tooltip>
                        {selectedNodeIds.length === 1 && (
                            <>
                                <Separator orientation="vertical" className="!h-4" />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6"
                                            onClick={() =>
                                                openDialogSettingNode(selectedNodeIds[0]!)
                                            }
                                        >
                                            <Settings className="size-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('shortcutsList.openConfig')}</TooltipContent>
                                </Tooltip>
                            </>
                        )}
                    </div>
                </div>
                {activeBuild && (
                    <div className="flex items-center gap-1.5">
                        <Separator orientation="vertical" className="!h-4" />
                        <div className="flex items-center gap-1.5">
                            <StatusLive
                                key={activeBuildId}
                                buildId={activeBuildId}
                                initialStatus={activeBuild.status}
                            />
                            <span className="flex items-center gap-1 text-xs font-medium">
                                <GitBranch className="size-3" />
                                {activeBuild.branch}
                                {activeBuild.commitHash && (
                                    <>
                                        <span className={'text-muted-foreground text-base'}>·</span>
                                        <span className="text-muted-foreground font-mono">
                                            {activeBuild.commitHash}
                                        </span>
                                    </>
                                )}
                            </span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => setActiveBuildId(undefined)}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('exitBuild')}</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        'text-muted-foreground flex items-center gap-1.5 text-xs transition-opacity duration-300',
                        isSaving ? 'opacity-100' : 'opacity-40',
                    )}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="size-3 animate-spin" />
                            {t('saving')}
                        </>
                    ) : (
                        <>
                            <Check className="size-3" />
                            {t('saved')}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
