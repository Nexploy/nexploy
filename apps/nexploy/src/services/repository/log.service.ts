import { prisma } from '../../../prisma/prisma';
import { BuildLogEntry } from '@workspace/typescript-interface/repository/build';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function createLog(log: BuildLogEntry) {
    const t = await getErrorTranslator();
    try {
        return await prisma.log.create({
            data: {
                ...log,
            },
        });
    } catch (error: unknown) {
        throw new Error(t('log.createFailed'));
    }
}

export async function createLogsBatch(logs: BuildLogEntry[]) {
    if (logs.length === 0) return;
    const t = await getErrorTranslator();
    try {
        await prisma.log.createMany({ data: logs });
    } catch {
        throw new Error(t('log.createManyFailed'));
    }
}
