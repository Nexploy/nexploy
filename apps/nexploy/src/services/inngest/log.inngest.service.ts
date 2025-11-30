import { prisma } from '../../../prisma/prisma';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';

export async function createLogInngest(log: BuildLogEntry) {
    try {
        return await prisma.log.create({
            data: {
                ...log,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to create log');
    }
}
