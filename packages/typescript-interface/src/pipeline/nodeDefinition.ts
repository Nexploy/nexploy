import { NodeCategory, NodeId, NodeType } from './node';
import { Position } from '@xyflow/react';

export interface HandleDefinition {
    id: string;
    position: Position;
acceptsFrom?: string;
}

export interface NodeDefinition<TConfig = Record<string, unknown>> {
    id: NodeId;
    type?: NodeType;
    category: NodeCategory;
    isStartNode?: boolean;
    metadata: {
        name: string;
        description: string;
        icon: string;
        color: string;
    };
    defaultConfig: TConfig;
    handles: {
        inputs: HandleDefinition[];
        outputs: HandleDefinition[];
        attachments: HandleDefinition[];
    };
}
