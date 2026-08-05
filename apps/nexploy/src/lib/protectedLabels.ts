import { z } from 'zod';
import { isProtectedLabelKey } from '@nexploy/shared/protectedLabels';

export function withEditableLabels<T extends z.ZodType<{ labels?: { key: string }[] }>>(schema: T): T {
    return schema.superRefine((value, ctx) => {
        value.labels?.forEach((label, index) => {
            if (!isProtectedLabelKey(label.key)) return;

            ctx.addIssue({
                code: 'custom',
                path: ['labels', index, 'key'],
                message: 'This label key is reserved by Nexploy and cannot be set manually',
            });
        });
    }) as unknown as T;
}
