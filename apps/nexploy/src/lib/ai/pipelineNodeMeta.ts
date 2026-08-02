import { z } from 'zod';
import { ALL_NODE_DESCRIPTORS } from '@nexploy/nodes/registry/descriptors';

export interface NodeMeta {
    schema: z.ZodObject<z.ZodRawShape> | null;
    category: string;
    description: string;
    isStartNode?: boolean;
    isEndNode?: boolean;
    outputs: string[];
    consumesFromUpstream?: string[];
}

export const NODE_META_MAP: Record<string, NodeMeta> = Object.fromEntries(
    ALL_NODE_DESCRIPTORS.map((descriptor) => [
        descriptor.type,
        {
            schema: (descriptor.configSchema as z.ZodObject<z.ZodRawShape> | undefined) ?? null,
            category: descriptor.category,
            description: descriptor.description,
            ...(descriptor.isStartNode && { isStartNode: true }),
            ...(descriptor.isEndNode && { isEndNode: true }),
            outputs: (descriptor.outputs ?? []).filter((output) => !output.internal).map((output) => output.key),
            ...(descriptor.consumesFromUpstream && {
                consumesFromUpstream: descriptor.consumesFromUpstream,
            }),
        },
    ]),
);
