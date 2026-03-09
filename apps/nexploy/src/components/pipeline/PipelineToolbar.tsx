'use client';

import {
    Check,
    Copy,
    GitBranch,
    Loader2,
    Power,
    Redo2,
    SquareDashed,
    Trash2,
    Undo2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Kbd } from '@workspace/ui/components/kbd';
import { useStore } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';

const isApple =
    navigator.platform.startsWith('Mac') || navigator.platform === 'iPhone' ? '⌘' : 'Ctrl';
const mod = isApple ? '⌘' : 'Ctrl';

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
        setNodes,
        triggerAutoSave,
        activeBuildId,
        activeBuilds,
    } = usePipelineContext();

    const addSelectedNodes = useStore((s) => s.addSelectedNodes);

    const disabledCount = nodes.filter((n) => n.data.disabled).length;
    const hasSelection = selectedNodeIds.length > 0;

    const watchedBuild = activeBuildId
        ? activeBuilds.find((b) => b.id === activeBuildId)
        : undefined;

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
                                    disabled={!canUndo}
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
                                    disabled={!canRedo}
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
                                    disabled={!hasSelection}
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
                                    disabled={!hasSelection}
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
                                    disabled={!hasSelection}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex items-center gap-1.5">
                                {t('shortcutsList.delete')} <Kbd>Del</Kbd>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                {watchedBuild && (
                    <div className="flex items-center gap-1.5">
                        <Separator orientation="vertical" className="!h-4" />
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                            <span className="text-muted-foreground text-xs">{t('watching')}</span>
                            <span className={'text-muted-foreground'}>·</span>
                            <span className="flex items-center gap-1 text-xs font-medium">
                                <GitBranch className="size-3" />
                                {watchedBuild.branch}
                                {watchedBuild.commitHash && (
                                    <>
                                        <span className={'text-muted-foreground text-base'}>·</span>
                                        <span className="text-muted-foreground font-mono">
                                            {watchedBuild.commitHash}
                                        </span>
                                    </>
                                )}
                            </span>
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
