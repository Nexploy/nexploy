import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { getPendingInvitations } from '@/services/organization.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .handler(async (_, { ctx }) => {
        try {
            const invitations = await getPendingInvitations(ctx.session.user.email);
            return NextResponse.json(invitations);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json(
                { error: t('api.pendingInvitationsFetchFailed') },
                { status: 500 },
            );
        }
    });
