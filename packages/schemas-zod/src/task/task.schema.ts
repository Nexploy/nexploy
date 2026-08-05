import { z } from 'zod';

export const taskIdSchema = z.object({
    taskId: z.string().min(1),
});

export type TaskIdInput = z.infer<typeof taskIdSchema>;

export const clearTasksSchema = z.object({});

export type ClearTasksInput = z.infer<typeof clearTasksSchema>;

export const clearTasksBodySchema = z.object({
    taskIds: z.array(z.string().min(1)).optional(),
});

export type ClearTasksBodyInput = z.infer<typeof clearTasksBodySchema>;
