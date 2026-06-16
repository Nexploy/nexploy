'use client';

import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Boxes, ChevronRight, Search, SearchX, Wrench, X } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@workspace/ui/components/input-group';
import { useNodeRegistryStore } from '@/stores/useNodeRegistryStore';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { NodeItem } from '@/components/pipeline/nodes/add/NodeItem';
import {
    CATEGORY_BG_MUTED,
    CATEGORY_ICONS,
    CATEGORY_TEXT,
} from '@/components/pipeline/pipelineTheme';
import { useReactFlow } from '@xyflow/react';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { getConfigSchema } from '@/components/pipeline/nodeManifestRegistry';
import { useIsViewingBuild, usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';

export function NodeAddPanel() {
    const t = useTranslations('repository.pipeline');
    const definitions = useNodeRegistryStore((s) => s.nodes);
    const { screenToFlowPosition } = useReactFlow();
    const { setNodes, triggerAutoSave, handleNodeAdded } = usePipelineActions();
    const isViewingBuild = useIsViewingBuild();

    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    const {
        paletteCategory: activeCategory,
        paletteSearch: search,
        setPaletteSearch: setSearch,
        openPaletteCategory: openCategory,
        setPaletteCategory: setActiveCategory,
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
        if (isViewingBuild) setActiveBuildId(null);
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onClickAdd = (nodeType: NodeId) => {
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
                    config: getConfigSchema(nodeType)?.partial().safeParse({}).data ?? {},
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

    const CategoryIcon = activeCategory ? (CATEGORY_ICONS[activeCategory] ?? Wrench) : Wrench;
    const categoryNodes = activeCategory ? (grouped[activeCategory] ?? []) : [];

    return (
        <div className="bg-sidebar flex h-full w-full flex-col overflow-hidden">
            <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
                <div className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-sm">
                    <Boxes className="size-3.5" strokeWidth={1.7} />
                </div>
                <span className="text-foreground truncate text-xs">{t('palette')}</span>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="shrink-0 p-2">
                    <InputGroup className="h-8">
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
                    <div className="px-2 pb-1">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted group flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5"
                        >
                            <ArrowLeft className="size-3.5 shrink-0" />
                            <span className="text-[10px] font-semibold tracking-wide">
                                {t('palette')}
                            </span>
                            <ChevronRight className="size-3 shrink-0" />
                            <div
                                className={cn(
                                    'flex size-5 shrink-0 items-center justify-center rounded-sm',
                                    CATEGORY_BG_MUTED[activeCategory],
                                    CATEGORY_TEXT[activeCategory],
                                )}
                            >
                                <CategoryIcon className="size-3" strokeWidth={1.5} />
                            </div>
                            <span className="text-foreground truncate text-xs font-medium">
                                {t(`categories.${activeCategory}`)}
                            </span>
                        </button>
                    </div>
                )}

                <ScrollAreaWithShadow
                    bottomShadow
                    className={'h-full overflow-hidden'}
                    colorShadow="from-sidebar via-sidebar/50"
                >
                    <div className="p-2 pt-1">
                        {isSearching && (
                            <>
                                {searchResults.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                                        <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                                            <SearchX className="size-4" />
                                        </div>
                                        <p className="text-muted-foreground text-xs">
                                            {t('searchNoResults')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        {searchResults.map((def) => (
                                            <NodeItem
                                                key={def.id}
                                                def={def}
                                                label={t(`nodes.${def.id}.name`)}
                                                description={descriptionFor(def.id)}
                                                onDragStart={onDragStart}
                                                onClick={() => onClickAdd(def.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {!isSearching && !activeCategory && (
                            <div className="grid grid-cols-2 gap-1.5">
                                {Object.entries(grouped).map(([category, defs]) => {
                                    const Icon = CATEGORY_ICONS[category] ?? Wrench;
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => openCategory(category)}
                                            className="border-border bg-card hover:border-foreground/15 hover:bg-muted flex cursor-pointer flex-col gap-2 rounded-lg border p-2.5 text-left"
                                        >
                                            <div className="flex justify-between">
                                                <div
                                                    className={cn(
                                                        'flex size-8 shrink-0 items-center justify-center rounded-md',
                                                        CATEGORY_BG_MUTED[category],
                                                        CATEGORY_TEXT[category],
                                                    )}
                                                >
                                                    <Icon className="size-4" strokeWidth={1.5} />
                                                </div>
                                                <ChevronRight className="text-muted-foreground size-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-foreground block truncate text-xs font-medium">
                                                    {t(`categories.${category}`)}
                                                </span>
                                                <span className="text-muted-foreground text-[10px] tabular-nums">
                                                    {defs.length} {t('palette').toLowerCase()}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {!isSearching && activeCategory && (
                            <div className="flex flex-col gap-1.5">
                                {categoryNodes.map((def) => (
                                    <NodeItem
                                        key={def.id}
                                        def={def}
                                        label={t(`nodes.${def.id}.name`)}
                                        description={descriptionFor(def.id)}
                                        onDragStart={onDragStart}
                                        onClick={() => onClickAdd(def.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
