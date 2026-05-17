import type { Context, Env, ValidationTargets } from 'hono';
import type { z } from 'zod';

export type AnySchema = z.ZodType;

export type SchemaRecord = Partial<Record<keyof ValidationTargets, AnySchema>>;

export type InputFromSchemas<S extends SchemaRecord> = {
    in: { [K in keyof S]: S[K] extends AnySchema ? z.input<S[K]> : never };
    out: { [K in keyof S]: S[K] extends AnySchema ? z.output<S[K]> : never };
};

export type TypedContext<S extends SchemaRecord> = Context<Env, string, InputFromSchemas<S>>;

export interface HandleOpts {
    status?: number;
    timeoutMs?: number;
}
