'use client';

import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Boxes, ChevronRight, MousePointerClick, Search, SearchX, Wrench, X } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@workspace/ui/components/input-group';
import { useNodeRegistryStore } from '@/stores/useNodeRegistryStore';
import { NodeId } from '@nexploy/nodes/core/node';
import { NodeItem } from '@/components/pipeline/nodes/add/NodeItem';
import {
    CATEGORY_BG,
    CATEGORY_BG_MUTED,
    CATEGORY_ICONS,
    CATEGORY_TEXT,
    compareCategories,
} from '@/components/pipeline/pipelineTheme';
import { useReactFlow } from '@xyflow/react';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { getConfigDefaults } from '@/components/pipeline/nodeManifestRegistry';
import { useIsViewingBuild, usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { EmptyState } from '@/components/shared/EmptyState';
import { useRepositoryGitProvider } from '@/contexts/RepositoryGitProviderContext';
import { isNodeSupportedByGitProvider } from '@/lib/pipeline/nodeProviderSupport';

export function NodeAddPanel() {
    const t = useTranslations('repository.pipeline');
    const definitions = useNodeRegistryStore((s) => s.nodes);
    const { screenToFlowPosition } = useReactFlow();
    const { setNodes, triggerAutoSave, handleNodeAdded } = usePipelineActions();
    const isViewingBuild = useIsViewingBuild();
    const gitProvider = useRepositoryGitProvider();

    const isUnsupported = (id: NodeId) => !isNodeSupportedByGitProvider(id, gitProvider);

    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    const {
        paletteCategory: activeCategory,
        paletteSearch: search,
        setPaletteSearch: setSearch,
        openPaletteCategory: openCategory,
        setPaletteCategory: setActiveCategory,
        closePanel,
    } = usePipelinePanelStore();

    const grouped = definitions.reduce<Record<string, typeof definitions>>((acc, def) => {
        if (!acc[def.category]) acc[def.category] = [];
        acc[def.category]!.push(def);
        return acc;
    }, {});

    const descriptionFor = (id: NodeId) => {
        const key = `nodes.${id}.description`;
        return t.has(key) ? t(key) : undefined;
    };

    const onDragStart = (event: React.DragEvent, nodeType: NodeId) => {
        if (isUnsupported(nodeType)) {
            event.preventDefault();
            return;
        }
        if (isViewingBuild) setActiveBuildId(null);
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onClickAdd = (nodeType: NodeId) => {
        if (isUnsupported(nodeType)) return;
        if (isViewingBuild) setActiveBuildId(null);
        const def = getNodeDefinition(nodeType);
        if (!def) return;

        const pane = document.querySelector('.react-flow__pane');
        const rect = pane?.getBoundingClientRect();
        const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        const position = screenToFlowPosition({ x: centerX, y: centerY });

        const nodeId = `${nodeType}-${Date.now()}`;
        setNodes((nodes) =>
            nodes.concat({
                id: nodeId,
                type: def.type,
                position: { x: position.x - 45, y: position.y - 45 },
                data: {
                    label: nodeType,
                    nodeType,
                    definition: def,
                    config: getConfigDefaults(nodeType),
                    isStartNode: def.isStartNode ?? false,
                    isEndNode: def.isEndNode ?? false,
                },
            }),
        );
        triggerAutoSave();
        handleNodeAdded(nodeType, nodeId);
    };

    const searchQuery = search.trim().toLowerCase();
    const isSearching = searchQuery.length > 0;

    const searchResults = isSearching
        ? definitions.filter((def) => {
              const name = t(`nodes.${def.id}.name`).toLowerCase();
              const desc = descriptionFor(def.id)?.toLowerCase() ?? '';
              return name.includes(searchQuery) || desc.includes(searchQuery);
          })
        : [];

    const groupedSearchResults = searchResults.reduce<Record<string, typeof definitions>>((acc, def) => {
        if (!acc[def.category]) acc[def.category] = [];
        acc[def.category]!.push(def);
        return acc;
    }, {});

    const orderedCategories = Object.entries(grouped).sort(([a], [b]) => compareCategories(a, b));
    const orderedSearchCategories = Object.entries(groupedSearchResults).sort(([a], [b]) => compareCategories(a, b));

    const CategoryIcon = activeCategory ? (CATEGORY_ICONS[activeCategory] ?? Wrench) : Wrench;
    const categoryNodes = activeCategory ? (grouped[activeCategory] ?? []) : [];

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex h-11 shrink-0 items-center gap-2 border-border/70 border-b px-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Boxes className="size-3.5" />
                </div>
                <span className="flex-1 truncate text-foreground text-xs">{t('palette')}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                    {t('nodeCount', { count: definitions.length })}
                </span>
                <button
                    onClick={closePanel}
                    aria-label={t('canvas.closePanel')}
                    title={t('canvas.closePanel')}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="size-3.5" />
                </button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="shrink-0 p-2">
                    <InputGroup className="h-8 shadow-none">
                        <InputGroupAddon>
                            <Search className="size-3.5" />
                        </InputGroupAddon>
                        <InputGroupInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('search')}
                        />
                        {search && (
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton size={'icon-xs'} onClick={() => setSearch('')}>
                                    <X className="size-3" />
                                </InputGroupButton>
                            </InputGroupAddon>
                        )}
                    </InputGroup>
                </div>

                {activeCategory && !isSearching && (
                    <div className={'mx-2 mb-2 flex items-center gap-2'}>
                        <button
                            type="button"
                            onClick={() => setActiveCategory(null)}
                            aria-label={t('palette')}
                            className="flex flex-1 shrink-0 items-center gap-2 rounded-md p-1 pl-2 transition-colors hover:bg-muted"
                        >
                            <ArrowLeft className="size-3.5 shrink-0 text-muted-foreground" />
                            <div className={'flex flex-1 items-center gap-2'}>
                                <div
                                    className={cn(
                                        'flex size-6 shrink-0 items-center justify-center rounded-md',
                                        CATEGORY_BG_MUTED[activeCategory],
                                        CATEGORY_TEXT[activeCategory],
                                    )}
                                >
                                    <CategoryIcon className="size-3" strokeWidth={1.7} />
                                </div>

                                <span className="min-w-0 flex-1 truncate text-left font-medium text-foreground text-xs">
                                    {t(`categories.${activeCategory}`)}
                                </span>
                            </div>
                        </button>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                            {t('nodeCount', { count: categoryNodes.length })}
                        </span>
                    </div>
                )}

                <ScrollAreaWithShadow
                    bottomShadow
                    key={activeCategory ?? 'categories'}
                    className={'h-full overflow-hidden'}
                >
                    <div className="@container p-2 pt-0">
                        {isSearching && (
                            <>
                                {searchResults.length === 0 ? (
                                    <EmptyState icon={SearchX} title={t('searchNoResults')} bordered={false} />
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        {orderedSearchCategories.map(([category, defs]) => (
                                            <div key={category} className="flex flex-col gap-1.5">
                                                {defs.map((def) => (
                                                    <NodeItem
                                                        key={def.id}
                                                        def={def}
                                                        label={t(`nodes.${def.id}.name`)}
                                                        description={descriptionFor(def.id)}
                                                        onDragStart={onDragStart}
                                                        onClick={() => onClickAdd(def.id)}
                                                        disabled={isUnsupported(def.id)}
                                                        disabledReason={t('unsupportedByGitProvider')}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {!isSearching && !activeCategory && (
                            <div className="grid @[420px]:grid-cols-2 grid-cols-1 gap-1.5">
                                {orderedCategories.map(([category, defs]) => {
                                    const Icon = CATEGORY_ICONS[category] ?? Wrench;
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => openCategory(category)}
                                            className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg border border-border/60 bg-card p-2 pl-2.5 text-left transition-colors hover:border-foreground/15 hover:bg-accent/40"
                                        >
                                            <span
                                                className={cn(
                                                    'absolute inset-y-1 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100',
                                                    CATEGORY_BG[category],
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    'flex size-7 shrink-0 items-center justify-center rounded-md',
                                                    CATEGORY_BG_MUTED[category],
                                                    CATEGORY_TEXT[category],
                                                )}
                                            >
                                                <Icon className="size-3.5" strokeWidth={1.6} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="block truncate font-medium text-foreground text-xs">
                                                    {t(`categories.${category}`)}
                                                </span>
                                                <span className="block text-[10px] text-muted-foreground tabular-nums">
                                                    {t('nodeCount', { count: defs.length })}
                                                </span>
                                            </div>
                                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {!isSearching && activeCategory && (
                            <div className="grid @[420px]:grid-cols-2 grid-cols-1 gap-1.5">
                                {categoryNodes.map((def) => (
                                    <NodeItem
                                        key={def.id}
                                        def={def}
                                        label={t(`nodes.${def.id}.name`)}
                                        description={descriptionFor(def.id)}
                                        onDragStart={onDragStart}
                                        onClick={() => onClickAdd(def.id)}
                                        disabled={isUnsupported(def.id)}
                                        disabledReason={t('unsupportedByGitProvider')}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>

                {(searchResults.length > 0 || (!isSearching && activeCategory)) && (
                    <div className="flex h-8 shrink-0 items-center gap-1.5 border-t px-3 text-muted-foreground">
                        <MousePointerClick className="size-3 shrink-0" />
                        <span className="truncate text-[10px]">{t('addNodeHint')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
