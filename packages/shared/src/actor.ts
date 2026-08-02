export const ACTOR_HEADERS = {
    userId: 'X-Nexploy-Actor-Id',
    email: 'X-Nexploy-Actor-Email',
    role: 'X-Nexploy-Actor-Role',
    organizationId: 'X-Nexploy-Actor-Organization',
    source: 'X-Nexploy-Actor-Source',
} as const;

export type ActorSource = 'user' | 'system';

export interface Actor {
    source: ActorSource;
    userId: string | null;
    email: string | null;
    role: string | null;
    organizationId: string | null;
}

export const SYSTEM_ACTOR: Actor = {
    source: 'system',
    userId: null,
    email: null,
    role: null,
    organizationId: null,
};

export function actorToHeaders(actor: Actor): Record<string, string> {
    const headers: Record<string, string> = { [ACTOR_HEADERS.source]: actor.source };

    if (actor.userId) headers[ACTOR_HEADERS.userId] = actor.userId;
    if (actor.email) headers[ACTOR_HEADERS.email] = actor.email;
    if (actor.role) headers[ACTOR_HEADERS.role] = actor.role;
    if (actor.organizationId) headers[ACTOR_HEADERS.organizationId] = actor.organizationId;

    return headers;
}

export function actorFromHeaders(read: (name: string) => string | null | undefined): Actor {
    const userId = read(ACTOR_HEADERS.userId) ?? null;
    const source = read(ACTOR_HEADERS.source) === 'user' && userId ? 'user' : 'system';

    return {
        source,
        userId,
        email: read(ACTOR_HEADERS.email) ?? null,
        role: read(ACTOR_HEADERS.role) ?? null,
        organizationId: read(ACTOR_HEADERS.organizationId) ?? null,
    };
}

export function describeActor(actor: Actor): string {
    if (actor.source === 'system') return 'system';
    return actor.email ? `${actor.email} (${actor.userId})` : (actor.userId ?? 'unknown');
}
