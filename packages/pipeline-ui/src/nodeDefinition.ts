import { NodeCategory, NodeGraphData, NodeId, NodeType } from '@workspace/pipeline-core/node';
import { Position } from '@xyflow/react';
import { LucideIcon } from 'lucide-react';

export interface HandleDefinition {
    id: string;
    position: Position;
    labelKey?: string;
    acceptsFrom?: string;
}

export interface NodeDefinition<TConfig = Record<string, unknown>> {
    id: NodeId;
    type?: NodeType;
    category: NodeCategory;
    isStartNode?: boolean;
    isEndNode?: boolean;
    metadata: {
        name: string;
        description?: string;
        icon: LucideIcon;
        color: string;
    };
    handles: {
        inputs: HandleDefinition[];
        outputs: HandleDefinition[];
        attachments: HandleDefinition[];
    };
}

export interface NodeData extends NodeGraphData {
    definition: NodeDefinition;
}
