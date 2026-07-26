import { prisma } from '../../../prisma/prisma';
import { decrypt } from '@/lib/encryption';

export interface WebhookRepositoryMatch {
    id: string;
    organizationId: string;
    userId: string | null;
    webhookSecret: string | null;
}

const webhookRepositorySelect = {
    id: true,
    organizationId: true,
    webhookSecret: true,
    gitAccount: { select: { userId: true } },
} as const;

type WebhookRepositoryRow = {
    id: string;
    organizationId: string;
    webhookSecret: string | null;
    gitAccount: { userId: string } | null;
};

function toMatch(repository: WebhookRepositoryRow): WebhookRepositoryMatch {
    return {
        id: repository.id,
        organizationId: repository.organizationId,
        userId: repository.gitAccount?.userId ?? null,
        webhookSecret: repository.webhookSecret ? decrypt(repository.webhookSecret) : null,
    };
}

export async function findRepositoriesByWebhook(
    repositoryUrl: string,
    repositoryId?: string | null,
): Promise<WebhookRepositoryMatch[]> {
    if (repositoryId) {
        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: webhookRepositorySelect,
        });
        return repository ? [toMatch(repository)] : [];
    }

    const repositories = await prisma.repository.findMany({
        where: { repositoryUrl },
        select: webhookRepositorySelect,
    });

    return repositories.map(toMatch);
}
