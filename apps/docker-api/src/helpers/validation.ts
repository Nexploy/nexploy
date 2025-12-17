import type { Context } from 'hono';
import type { z } from 'zod';

export const getValidatedJson = <T extends z.ZodSchema>(c: Context, _schema: T): z.infer<T> => {
    return c.req.valid('json' as never) as z.infer<T>;
};

export const getValidatedParam = <T extends z.ZodSchema>(c: Context, _schema: T): z.infer<T> => {
    return c.req.valid('param' as never) as z.infer<T>;
};
