import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { HOST_SCOPED, resolveActiveOrganizationId } from '@/lib/auth/resolveOrgContext';
import { listBuildTasks } from '@/services/repository/buildTask.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('build', 'read', HOST_SCOPED))
    .handler(async (_request, { ctx }) => {
        const organizationId = await resolveActiveOrganizationId(ctx.session);

        if (!organizationId) return NextResponse.json({ tasks: [] });

        return NextResponse.json({ tasks: await listBuildTasks(organizationId) });
    });
