'use client';

import { usePipelinePanelStore } from '@/stores/usePipelinePanelStore';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronRight, Search, Wrench, X } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, } from '@workspace/ui/components/input-group';
import { useNodeRegistryStore } from '@/stores/useNodeRegistryStore';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { NodeItem } from '@/components/pipeline/nodes/add/NodeItem';
import { CATEGORY_BG_MUTED, CATEGORY_ICONS, CATEGORY_TEXT, } from '@/components/pipeline/pipelineTheme';
import { useReactFlow } from '@xyflow/react';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { getConfigSchema } from '@/components/pipeline/nodeManifestRegistry';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';

export function NodeAddPanel() {
    const t = useTranslations('repository.pipeline');
    const definitions = useNodeRegistryStore((s) => s.nodes);
    const { screenToFlowPosition } = useReactFlow();
    const { setNodes, triggerAutoSave, handleNodeAdded, isViewingBuild } = usePipelineContext();

    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    const {
        activePanel,
        paletteCategory: activeCategory,
        paletteSearch: search,
        setPaletteSearch: setSearch,
        openPaletteCategory: openCategory,
        setPaletteCategory: setActiveCategory,
    } = usePipelinePanelStore();
    const open = activePanel === 'palette';

    const grouped = definitions.reduce<Record<string, typeof definitions>>((acc, def) => {
        if (!acc[def.category]) acc[def.category] = [];
        acc[def.category]!.push(def);
        return acc;
    }, {});

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
        ? definitions.filter((def) => t(`nodes.${def.id}.name`).toLowerCase().includes(searchQuery))
        : [];

    const Icon = activeCategory ? (CATEGORY_ICONS[activeCategory] ?? Wrench) : Wrench;

    return (
        <div
            className={cn(
                'bg-sidebar flex shrink-0 flex-col overflow-hidden transition-all duration-200',
                open ? 'w-[25%] border-l' : 'w-0',
            )}
        >
            <span className="border-b p-3 text-[10px] font-semibold tracking-widest uppercase">
                {t('palette')}
            </span>

            <div className="flex flex-1 flex-col overflow-hidden">
                {!activeCategory && (
                    <div className="border-b p-2">
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
                                    <InputGroupButton
                                        size={'icon-xs'}
                                        onClick={() => setSearch('')}
                                    >
                                        <X className="size-3" />
                                    </InputGroupButton>
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>
                )}

                {activeCategory && (
                    <div className="border-b">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className="hover:bg-muted flex h-12 w-full cursor-pointer items-center gap-2 px-2.5 transition-colors"
                        >
                            <ArrowLeft className="text-muted-foreground size-3.5 shrink-0" />
                            <div
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-md',
                                    CATEGORY_BG_MUTED[activeCategory],
                                    CATEGORY_TEXT[activeCategory],
                                )}
                            >
                                <Icon className="size-3.5" strokeWidth={1.5} />
                            </div>
                            <span className="text-foreground text-xs font-medium">
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
                    <div className="grid grid-cols-1 gap-2 p-2">
                        {isSearching && searchResults.length === 0 && (
                            <p className="text-muted-foreground text-center text-xs">
                                {t('searchNoResults')}
                            </p>
                        )}

                        {isSearching &&
                            searchResults.map((def) => (
                                <NodeItem
                                    key={def.id}
                                    def={def}
                                    label={t(`nodes.${def.id}.name`)}
                                    onDragStart={onDragStart}
                                    onClick={() => onClickAdd(def.id)}
                                />
                            ))}

                        {!isSearching &&
                            !activeCategory &&
                            Object.entries(grouped).map(([category, defs]) => (
                                <button
                                    key={category}
                                    onClick={() => openCategory(category)}
                                    className="border-border bg-card hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg border px-1.5 py-1.5 transition-all"
                                >
                                    <div className={'flex min-w-0 flex-1 items-center gap-2'}>
                                        {(() => {
                                            const Icon = CATEGORY_ICONS[category] ?? Wrench;
                                            return (
                                                <div
                                                    className={cn(
                                                        'flex size-7 shrink-0 items-center justify-center rounded-md',
                                                        CATEGORY_BG_MUTED[category],
                                                        CATEGORY_TEXT[category],
                                                    )}
                                                >
                                                    <Icon className="size-3.5" strokeWidth={1.5} />
                                                </div>
                                            );
                                        })()}
                                        <span className="truncate text-xs">
                                            {t(`categories.${category}`)}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground flex items-center gap-1">
                                        <span className="text-[10px]">{defs.length}</span>
                                        <ChevronRight className="size-3.5" />
                                    </div>
                                </button>
                            ))}

                        {!isSearching &&
                            activeCategory &&
                            grouped[activeCategory]?.map((def) => (
                                <NodeItem
                                    key={def.id}
                                    def={def}
                                    label={t(`nodes.${def.id}.name`)}
                                    onDragStart={onDragStart}
                                    onClick={() => onClickAdd(def.id)}
                                />
                            ))}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
