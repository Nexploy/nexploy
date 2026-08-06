import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { isPersonalOrganization, searchInvitableUsers } from '@/services/organization.service';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { organizationIdParamSchema, userSearchQuerySchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .params(organizationIdParamSchema)
    .query(userSearchQuerySchema)
    .handler(async (_, { params, query, ctx }) => {
        const { organizationId } = params;
        const t = await getErrorTranslator();

        const callerRole = await getCallerOrgRole(ctx.session.user.id, organizationId);
        const isGlobalAdmin = ctx.session.user.role === 'admin';

        if (callerRole !== 'owner' && callerRole !== 'admin' && !isGlobalAdmin) {
            return NextResponse.json({ error: t('api.organizationNotFound') }, { status: 404 });
        }

        if (await isPersonalOrganization(organizationId)) {
            return NextResponse.json([]);
        }

        try {
            const users = await searchInvitableUsers(organizationId, query.q ?? '');

            return NextResponse.json(users);
        } catch {
            return NextResponse.json({ error: t('api.invitableUsersFetchFailed') }, { status: 500 });
        }
    });
