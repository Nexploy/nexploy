import { type ComponentType } from 'react';
import { type NodeLifecycleCallbacks } from '@workspace/typescript-interface/pipeline/node';
import { getConfigSchema, getConfigPanel, getNodeLifecycle } from '@/components/pipeline/nodeManifestRegistry';

export const CONFIG_SCHEMAS = new Proxy({} as Record<string, any>, {
    get: (_, key: string) => getConfigSchema(key),
});

export const CONFIG_PANELS = new Proxy({} as Record<string, ComponentType>, {
    get: (_, key: string) => getConfigPanel(key),
});

export const NODE_LIFECYCLE = new Proxy({} as Record<string, NodeLifecycleCallbacks | undefined>, {
    get: (_, key: string) => getNodeLifecycle(key),
});
