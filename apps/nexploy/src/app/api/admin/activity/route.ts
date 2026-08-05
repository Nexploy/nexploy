import { NextResponse } from 'next/server';
import { activityQuerySchema } from '@workspace/schemas-zod/admin/activity.schema';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { queryActivityLogs } from '@/services/activityLog.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('activity', 'read'))
    .query(activityQuerySchema)
    .handler(async (_request, { query }) => {
        const page = await queryActivityLogs(query);

        return NextResponse.json(page);
    });
