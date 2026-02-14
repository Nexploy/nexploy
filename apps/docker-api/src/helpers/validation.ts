import type { Context } from 'hono';
import type { z } from 'zod';
import { getTranslations } from '@/middleware/locale.middleware';

export const getValidatedJson = <T extends z.ZodSchema>(c: Context, _schema: T): z.infer<T> => {
    const validated = c.req.valid('json' as never);

    if (!validated) {
        const t = getTranslations(c, 'docker');
        const error: any = new Error(t('errors.invalidRequestBody'));
        error.status = 400;
        throw error;
    }

    return validated as z.infer<T>;
};

export const getValidatedParam = <T extends z.ZodSchema>(c: Context, _schema: T): z.infer<T> => {
    const validated = c.req.valid('param' as never);

    if (!validated) {
        const t = getTranslations(c, 'docker');
        const error: any = new Error(t('errors.invalidRequestParams'));
        error.status = 400;
        throw error;
    }

    return validated as z.infer<T>;
};
