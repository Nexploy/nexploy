'use client';

import { cn } from '@workspace/ui/lib/utils';
import { usePipelinePanelStore } from '@/stores/usePipelinePanelStore';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { TEST_SCENARIOS, type TestScenario } from './testScenarios';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { CONFIG_SCHEMAS } from '@/components/pipeline/nodes/nodeConfigPanel/nodeConfigRegistry';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { useReactFlow } from '@xyflow/react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { Button } from '@workspace/ui/components/button';
import { FlaskConical } from 'lucide-react';

export function NodeTestPanel() {
    const { activePanel } = usePipelinePanelStore();
    const open = activePanel === 'test';
    const { setNodes, setEdges, triggerAutoSave, isViewingBuild } = usePipelineContext();
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);
    const { screenToFlowPosition } = useReactFlow();

    function loadScenario(scenario: TestScenario) {
        if (isViewingBuild) setActiveBuildId(null);

        const pane = document.querySelector('.react-flow__pane');
        const rect = pane?.getBoundingClientRect();
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        const center = screenToFlowPosition({ x: cx, y: cy });
        const origin = { x: center.x - 45, y: center.y - 45 };

        const ts = Date.now();
        const newNodes = scenario.nodes.map((tn, i) => {
            const def = getNodeDefinition(tn.type as NodeId);
            return {
                id: `test-${tn.type}-${ts}-${i}`,
                type: def?.type,
                position: { x: origin.x + tn.offsetX, y: origin.y + tn.offsetY },
                data: {
                    label: tn.type,
                    nodeType: tn.type as NodeId,
                    definition: def,
                    config: {
                        ...(CONFIG_SCHEMAS[tn.type]?.partial().safeParse({}).data ?? {}),
                        ...(tn.config ?? {}),
                    },
                    isStartNode: def?.isStartNode ?? false,
                },
            };
        });

        const newEdges = scenario.edges.map((te) => ({
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
    }

    return (
        <div
            className={cn(
                'bg-sidebar flex shrink-0 flex-col overflow-hidden transition-all duration-200',
                open ? 'w-[20%] border-l' : 'w-0',
            )}
        >
            <div className="border-b flex items-center gap-2 p-3">
                <FlaskConical className="size-3.5 text-orange-500 shrink-0" />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-orange-500">
                    Test Scenarios
                </span>
            </div>

            <ScrollAreaWithShadow
                bottomShadow
                className="h-full overflow-hidden"
                colorShadow="from-sidebar via-sidebar/50"
            >
                <div className="flex flex-col gap-2 p-2">
                    {TEST_SCENARIOS.map((scenario) => (
                        <div
                            key={scenario.id}
                            className="rounded-md border bg-card p-3 flex flex-col gap-2"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium leading-tight">
                                    {scenario.name}
                                </span>
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                    {scenario.nodes.length} nodes
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                {scenario.description}
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-7"
                                onClick={() => loadScenario(scenario)}
                            >
                                Charger
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
