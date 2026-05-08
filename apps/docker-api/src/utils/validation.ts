import type { Context } from 'hono';
import type { z } from 'zod';

export const getValidatedJson = <T extends z.ZodSchema>(c: Context, _schema: T): z.infer<T> => {
    const validated = c.req.valid('json' as never);

    if (!validated) {
        const error: any = new Error('Invalid request body: validation failed.');
        error.status = 400;
        throw error;
    }

    return validated as z.infer<T>;
};

export const getValidatedParam = <T extends z.ZodSchema>(c: Context, _schema: T): z.infer<T> => {
    const validated = c.req.valid('param' as never);

    if (!validated) {
        const error: any = new Error('Invalid request parameters: validation failed.');
        error.status = 400;
        throw error;
    }

    return validated as z.infer<T>;
};
