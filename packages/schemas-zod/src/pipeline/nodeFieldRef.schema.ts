import { z } from 'zod';

export const nodeFieldRefSchema = z.object({
    __nexploy_ref: z.literal(true),
    nodeId: z.string(),
    inputKey: z.string(),
    nodeType: z.string().optional(),
});

export type NodeFieldRefSchema = typeof nodeFieldRefSchema;

export function refAwareString(): z.ZodUnion<[z.ZodString, NodeFieldRefSchema]>;
export function refAwareString<T extends z.ZodTypeAny>(
    inner: T,
): z.ZodUnion<[T, NodeFieldRefSchema]>;
export function refAwareString(
    inner: z.ZodTypeAny = z.string(),
): z.ZodUnion<[z.ZodTypeAny, NodeFieldRefSchema]> {
    return z.union([inner, nodeFieldRefSchema]);
}
