import { z } from 'zod';

export const nodeFieldRefSchema = z.object({
    nodeId: z.string(),
    inputKey: z.string(),
    labelKey: z.string(),
    nodeType: z.string().optional(),
});

export type NodeFieldRef = z.infer<typeof nodeFieldRefSchema>;

export function refable<T extends z.ZodTypeAny>(schema: T) {
    return z.union([nodeFieldRefSchema, schema]);
}

export type ResolveRefs<T> = T extends NodeFieldRef
    ? never
    : T extends Array<infer U>
      ? Array<ResolveRefs<U>>
      : T extends object
        ? { [K in keyof T]: ResolveRefs<T[K]> }
        : Exclude<T, NodeFieldRef>;
