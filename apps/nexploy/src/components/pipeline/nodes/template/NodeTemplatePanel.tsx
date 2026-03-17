'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { usePipelinePanelStore } from '@/stores/usePipelinePanelStore';
import { PIPELINE_TEMPLATES, PipelineTemplate } from './pipelineTemplates';
import { TemplateItem } from '@/components/pipeline/nodes/template/TemplateItem';
import { useReactFlow } from '@xyflow/react';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { usePipelineContext } from '@/contexts/PipelineContext';

export function NodeTemplatePanel() {
    const t = useTranslations('repository.pipeline');
    const { activePanel } = usePipelinePanelStore();
    const open = activePanel === 'template';
    const { screenToFlowPosition } = useReactFlow();
    const { setNodes, setEdges, triggerAutoSave } = usePipelineContext();

    const onClickAdd = (template: PipelineTemplate) => {
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
                    config: { ...(def?.defaultConfig ?? {}), ...(tn.config ?? {}) },
                    isStartNode: def?.isStartNode ?? false,
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
        <div
            className={cn(
                'bg-sidebar flex shrink-0 flex-col overflow-hidden transition-all duration-200',
                open ? 'w-[20%] border-l' : 'w-0',
            )}
        >
            <span className="border-b p-3 text-[10px] font-semibold tracking-widest uppercase">
                {t('templates.title')}
            </span>

            <div className="flex flex-1 flex-col gap-1.5 p-2">
                {PIPELINE_TEMPLATES.map((template) => (
                    <TemplateItem
                        key={template.id}
                        template={template}
                        onClick={() => onClickAdd(template)}
                    />
                ))}
            </div>
        </div>
    );
}
