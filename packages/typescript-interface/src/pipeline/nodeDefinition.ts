import { NodeCategory, NodeType } from './node';

export interface HandleDefinition {
    id: string;
    label?: string;
    required?: boolean;
}

export interface NodeDefinition<TConfig = Record<string, unknown>> {
    type: NodeType | string;
    category: NodeCategory;
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
    };
}
