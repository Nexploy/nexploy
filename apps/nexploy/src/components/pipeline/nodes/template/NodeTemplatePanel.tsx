'use client';

import { useTranslations } from 'next-intl';
import { LayoutTemplate } from 'lucide-react';
import { PIPELINE_TEMPLATES, PipelineTemplate } from './pipelineTemplates';
import { TemplateItem } from '@/components/pipeline/nodes/template/TemplateItem';
import { useReactFlow } from '@xyflow/react';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { getConfigDefaults } from '@/components/pipeline/nodeManifestRegistry';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { useIsViewingBuild, usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';

export function NodeTemplatePanel() {
    const t = useTranslations('repository.pipeline');
    const { screenToFlowPosition } = useReactFlow();

    const { setNodes, setEdges, triggerAutoSave } = usePipelineActions();
    const isViewingBuild = useIsViewingBuild();

    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    const onClickAdd = (template: PipelineTemplate) => {
        if (isViewingBuild) setActiveBuildId(null);
        const pane = document.querySelector('.react-flow__pane');
        const rect = pane?.getBoundingClientRect();
        const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        const center = screenToFlowPosition({ x: centerX, y: centerY });
        const dropPosition = { x: center.x - 45, y: center.y - 45 };

        const ts = Date.now();
        const newNodes = template.nodes.map((tn, i) => {
            const def = getNodeDefinition(tn.type as NodeId);
            return {
                id: `${tn.type}-${ts}-${i}`,
                type: def?.type,
                position: { x: dropPosition.x + tn.offsetX, y: dropPosition.y + tn.offsetY },
                data: {
                    label: tn.type,
                    nodeType: tn.type,
                    definition: def,
                    config: {
                        ...getConfigDefaults(tn.type),
                        ...(tn.config ?? {}),
                    },
                    isStartNode: def?.isStartNode ?? false,
                    isEndNode: def?.isEndNode ?? false,
                },
            };
        });

        const newEdges = template.edges.map((te) => ({
            id: `e-${newNodes[te.sourceIndex]!.id}-${newNodes[te.targetIndex]!.id}`,
            source: newNodes[te.sourceIndex]!.id,
            target: newNodes[te.targetIndex]!.id,
            sourceHandle: te.sourceHandle,
            targetHandle: te.targetHandle,
            type: 'gradient-edge',
        }));

        setNodes(() => newNodes);
        setEdges(() => newEdges);
        triggerAutoSave();
    };

    return (
        <div className="bg-sidebar flex h-full w-full flex-col overflow-hidden">
            <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
                <div className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-sm">
                    <LayoutTemplate className="size-3.5" />
                </div>
                <span className="text-foreground truncate text-xs">{t('templates.title')}</span>
            </div>

            <ScrollAreaWithShadow
                bottomShadow
                className={'h-full overflow-hidden'}
                colorShadow="from-sidebar via-sidebar/50"
            >
                <div className="grid grid-cols-1 gap-2 p-2">
                    {PIPELINE_TEMPLATES.map((template) => (
                        <TemplateItem
                            key={template.id}
                            template={template}
                            onClick={() => onClickAdd(template)}
                            onDragStart={isViewingBuild ? () => setActiveBuildId(null) : undefined}
                        />
                    ))}
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
