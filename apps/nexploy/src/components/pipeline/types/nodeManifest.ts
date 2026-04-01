import { type ComponentType } from 'react';
import { type ZodTypeAny } from 'zod';
import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { type NodeLifecycleCallbacks } from '@workspace/typescript-interface/pipeline/node';

export interface NodeManifest {
    type: string;
    definition: NodeDefinition;
    configSchema?: ZodTypeAny;
    configPanel?: ComponentType;
    lifecycle?: NodeLifecycleCallbacks;
}
