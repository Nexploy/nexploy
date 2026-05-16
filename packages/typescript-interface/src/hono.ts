import type { Context, Env, ValidationTargets } from 'hono';
import type { z } from 'zod';

export type AnySchema = z.ZodType;

export type SchemaFactory = (t: (key: string, params?: Record<string, string | number>) => string) => AnySchema;

export type AnySchemaOrFactory = AnySchema | SchemaFactory;

export type SchemaRecord = Partial<Record<keyof ValidationTargets, AnySchemaOrFactory>>;

type ResolvedSchema<T extends AnySchemaOrFactory> =
    T extends SchemaFactory ? ReturnType<T> : T extends AnySchema ? T : never;

export type InputFromSchemas<S extends SchemaRecord> = {
    in: { [K in keyof S]: S[K] extends AnySchemaOrFactory ? z.input<ResolvedSchema<S[K]>> : never };
    out: { [K in keyof S]: S[K] extends AnySchemaOrFactory ? z.output<ResolvedSchema<S[K]>> : never };
};

export type TypedContext<S extends SchemaRecord> = Context<Env, string, InputFromSchemas<S>>;

export interface HandleOpts {
    status?: number;
    timeoutMs?: number;
}
