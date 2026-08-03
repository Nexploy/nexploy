import { cache } from 'react';
import { getUserSession } from '@/services/auth/auth.service';
import { resolveActiveOrganizationId } from '@/lib/auth/resolveOrgContext';
import { type Actor, SYSTEM_ACTOR } from '@nexploy/shared/actor';

export const getCurrentActor = cache(async (): Promise<Actor> => {
    try {
        const session = await getUserSession();
        if (!session) return SYSTEM_ACTOR;

        return {
            source: 'user',
            userId: session.user.id,
            email: session.user.email ?? null,
            role: session.user.role ?? null,
            organizationId: await resolveActiveOrganizationId(session),
        };
    } catch {
        return SYSTEM_ACTOR;
    }
});
