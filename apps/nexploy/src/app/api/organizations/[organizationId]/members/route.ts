import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { getOrganizationDetail } from '@/services/organization.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { organizationIdParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .params(organizationIdParamSchema)
    .handler(async (_, { params, ctx }) => {
        const { organizationId } = params;
        const t = await getErrorTranslator();

        try {
            const detail = await getOrganizationDetail(
                organizationId,
                ctx.session.user.id,
                ctx.session.user.role === 'admin',
            );

            if (!detail) {
                return NextResponse.json({ error: t('api.organizationNotFound') }, { status: 404 });
            }

            return NextResponse.json(detail);
        } catch {
            return NextResponse.json(
                { error: t('api.organizationMembersFetchFailed') },
                { status: 500 },
            );
        }
    });
