'use client';

import '@xyflow/react/dist/style.css';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { validatePipelineAction } from '@/actions/repository/pipeline/validatePipeline.action';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { flowToGraph } from '@/components/pipeline/utils/graphConvert';
import { NodePalette } from '@/components/pipeline/NodePalette';
import { NodeConfigPanel } from '@/components/pipeline/NodeConfigPanel';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';

export function PipelineEditor({ repositoryId }: { repositoryId: string }) {
    const t = useTranslations('repository.pipeline');
    const { nodes, edges, selectedNodeId, selectedNodeIds } = usePipelineContext();
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    const { execute: save, isPending: isSaving } = useAction(savePipelineAction);
    const { execute: validate, isPending: isValidating } = useAction(validatePipelineAction, {
        onSuccess: ({ data }) => {
            if (data?.valid) {
                toast.success(t('validationSuccess'));
            } else {
                toast.error(t('validationFailed'), { description: data?.errors.join('\n') });
            }
        },
    });

    const handleSave = () => save({ repositoryId, graph: flowToGraph(nodes, edges) });
    const handleValidate = () => validate({ graph: flowToGraph(nodes, edges) });

    return (
        <div className="flex h-full flex-col border-t">
            {/*<PipelineToolbar*/}
            {/*    onSave={handleSave}*/}
            {/*    onValidate={handleValidate}*/}
            {/*    isSaving={isSaving}*/}
            {/*    isValidating={isValidating}*/}
            {/*/>*/}
            <div className="flex flex-1">
                <NodePalette />
                <PipelineCanvas />
                {selectedNode && selectedNodeIds.length <= 1 && (
                    <NodeConfigPanel
                        node={{
                            id: selectedNode.id,
                            type: selectedNode.data.pipelineNodeType as NodeType,
                            position: selectedNode.position,
                            data: {
                                type: selectedNode.data.pipelineNodeType as NodeType,
                                config: (selectedNode.data.config as Record<string, unknown>) ?? {},
                                label: selectedNode.data.label as string,
                            },
                        }}
                    />
                )}
            </div>
        </div>
    );
}
