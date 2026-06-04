import { prisma } from '../../prisma/prisma';

export async function getAISettings() {
    return prisma.aISettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton' },
        update: {},
    });
}

export async function updateRequireDestructiveConfirmation(value: boolean): Promise<void> {
    await prisma.aISettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', requireDestructiveConfirmation: value },
        update: { requireDestructiveConfirmation: value },
    });
}
