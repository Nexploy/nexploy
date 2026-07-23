import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { getUserOrganizations } from '@/services/organization.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .handler(async (_, { ctx }) => {
        try {
            const organizations = await getUserOrganizations(ctx.session.user.id);
            return NextResponse.json(organizations);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.organizationsFetchFailed') }, { status: 500 });
        }
    });
