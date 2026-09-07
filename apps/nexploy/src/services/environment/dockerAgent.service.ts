import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { AGENT_TOKEN_PREFIX } from '@workspace/agent-protocol';
import type { AgentSystemInfo } from '@workspace/agent-protocol';
import type { DockerAgentInfo, DockerAgentWithToken } from '@workspace/typescript-interface/docker/agent/agent';
import { prisma } from '../../../prisma/prisma';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

const TOKEN_BYTES = 32;
const ONLINE_WINDOW_MS = 90_000;

const agentSelect = {
    id: true,
    environmentId: true,
    tokenPrefix: true,
    status: true,
    lastSeenAt: true,
    version: true,
    hostname: true,
    platform: true,
    architecture: true,
    dockerVersion: true,
    createdAt: true,
} as const;

export function hashAgentToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function generateAgentToken(): { token: string; tokenHash: string; tokenPrefix: string } {
    const token = `${AGENT_TOKEN_PREFIX}${randomBytes(TOKEN_BYTES).toString('hex')}`;

    return {
        token,
        tokenHash: hashAgentToken(token),
        tokenPrefix: token.slice(0, AGENT_TOKEN_PREFIX.length + 8),
    };
}

function markStale(agent: DockerAgentInfo): DockerAgentInfo {
    const seenRecently = agent.lastSeenAt !== null && Date.now() - agent.lastSeenAt.getTime() < ONLINE_WINDOW_MS;

    if (agent.status === 'ONLINE' && !seenRecently) {
        return { ...agent, status: 'OFFLINE' };
    }

    return agent;
}

export async function createDockerAgent(environmentId: string, createdById?: string): Promise<DockerAgentWithToken> {
    const t = await getErrorTranslator();
    const { token, tokenHash, tokenPrefix } = generateAgentToken();

    try {
        const agent = await prisma.dockerAgent.create({
            data: { environmentId, tokenHash, tokenPrefix, createdById: createdById ?? null },
            select: agentSelect,
        });

        return { agent, token };
    } catch {
        throw new Error(t('dockerAgent.createFailed'));
    }
}

export async function getDockerAgentByEnvironmentId(environmentId: string): Promise<DockerAgentInfo | null> {
    const agent = await prisma.dockerAgent.findUnique({ where: { environmentId }, select: agentSelect });

    return agent ? markStale(agent) : null;
}

export async function regenerateDockerAgentToken(environmentId: string): Promise<DockerAgentWithToken> {
    const t = await getErrorTranslator();
    const { token, tokenHash, tokenPrefix } = generateAgentToken();

    try {
        const agent = await prisma.dockerAgent.update({
            where: { environmentId },
            data: { tokenHash, tokenPrefix, status: 'OFFLINE', lastSeenAt: null },
            select: agentSelect,
        });

        return { agent, token };
    } catch {
        throw new Error(t('dockerAgent.regenerateFailed'));
    }
}

export async function verifyDockerAgentToken(token: string): Promise<DockerAgentInfo | null> {
    if (!token.startsWith(AGENT_TOKEN_PREFIX)) return null;

    const candidate = await prisma.dockerAgent.findUnique({
        where: { tokenHash: hashAgentToken(token) },
        select: { ...agentSelect, tokenHash: true, environment: { select: { isActive: true } } },
    });

    if (!candidate || !candidate.environment.isActive) return null;

    const expected = Buffer.from(candidate.tokenHash, 'hex');
    const provided = Buffer.from(hashAgentToken(token), 'hex');

    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

    const { tokenHash: _tokenHash, environment: _environment, ...agent } = candidate;

    return agent;
}

export async function markDockerAgentOnline(id: string, system: AgentSystemInfo) {
    await prisma.dockerAgent
        .update({
            where: { id },
            data: {
                status: 'ONLINE',
                lastSeenAt: new Date(),
                version: system.agentVersion ?? null,
                hostname: system.hostname ?? null,
                platform: system.platform ?? null,
                architecture: system.architecture ?? null,
                dockerVersion: system.dockerVersion ?? null,
            },
        })
        .catch(() => undefined);
}

export async function markDockerAgentOffline(id: string) {
    await prisma.dockerAgent.update({ where: { id }, data: { status: 'OFFLINE' } }).catch(() => undefined);
}

export async function touchDockerAgent(id: string) {
    await prisma.dockerAgent
        .update({ where: { id }, data: { status: 'ONLINE', lastSeenAt: new Date() } })
        .catch(() => undefined);
}
