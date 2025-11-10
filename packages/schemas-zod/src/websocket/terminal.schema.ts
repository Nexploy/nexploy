import { z } from 'zod';

export const terminalSchema = z.object({
    containerId: z.string(),
    shell: z.enum(['auto', 'bash', 'sh', 'ash', 'dash']).default('auto').optional(),
});

export type TerminalInter = z.infer<typeof terminalSchema>;
