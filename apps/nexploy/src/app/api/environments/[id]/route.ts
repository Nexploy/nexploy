import { NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { decrypt } from '@/lib/encryption';
import { idParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('environment', 'read'))
    .params(idParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { id } = params;

            const environment = await prisma.environment.findUnique({
                where: {
                    id: id,
                    isActive: true,
                },
            });

            if (!environment) {
                const t = await getErrorTranslator();
                return NextResponse.json({ error: t('api.environmentNotFound') }, { status: 404 });
            }

            return NextResponse.json({
                ...environment,
                tlsCert: environment.tlsCert ? decrypt(environment.tlsCert) : null,
                tlsKey: environment.tlsKey ? decrypt(environment.tlsKey) : null,
                tlsCa: environment.tlsCa ? decrypt(environment.tlsCa) : null,
            });
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.environmentFetchFailed') }, { status: 500 });
        }
    });
