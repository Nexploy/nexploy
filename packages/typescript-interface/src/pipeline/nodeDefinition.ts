import { NodeCategory, NodeId, NodeType } from './node';

export interface HandleDefinition {
    id: string;
    required?: boolean;
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
        attachments?: HandleDefinition[];
    };
}
