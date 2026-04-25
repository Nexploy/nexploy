import { type ComponentType } from 'react';
import { z } from 'zod';
import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { type NodeLifecycleCallbacks } from '@workspace/typescript-interface/pipeline/node';

export interface NodeInputField {
    key: string;
    labelKey: string;
    descriptionKey?: string;
    type: 'input' | 'number';
}

export interface NodeManifest {
    type: string;
    definition: NodeDefinition;
    configSchema?: z.ZodObject<any>;
    configPanel: ComponentType;
    lifecycle?: NodeLifecycleCallbacks;
    inputFields?: NodeInputField[];
}
