import { createMiddleware, createSafeActionClient } from 'next-safe-action';
import { getUserSession } from '@/services/auth/auth.service';
import { Session } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';
import { hasPermission, type PermissionActions, type PermissionResource, } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { isOrgScopedResource } from '@/lib/auth/orgScopedResources';
import { getCallerOrgRole, type OrgResolver } from '@/lib/auth/resolveOrgContext';
import { kyDocker } from '@/lib/api/kyDocker';
import { isNexployInfrastructureNetworkName } from '@workspace/shared/nexployFilter';

export const actionServer = createSafeActionClient({
    handleServerError(error) {
        console.error(`[ACTION ERROR] ${error.message}`);
        return error.message || 'Error occurred';
    },
});

export const authActionServer = actionServer.use(async ({ next }) => {
    const session = await getUserSession();

    if (!session) {
        await setToastServer({
            type: 'error',
            message: 'Unauthorized action attempt',
        });
        redirect('/');
    }

    if (session.user.banned) {
        await setToastServer({
            type: 'error',
            message: 'Your account has been banned',
        });
        redirect('/');
    }

    return next({ ctx: { session } });
});

export const requirePermission = <R extends PermissionResource>(
    resource: R,
    action: PermissionActions[R],
    orgResolver?: OrgResolver,
) =>
    createMiddleware<{ ctx: { session: Session } }>().define(async ({ ctx, clientInput, next }) => {
        const role = ctx.session.user.role as string;
        const t = await getTranslations('common');

        if (isOrgScopedResource(resource) && role !== 'admin' && orgResolver) {
            const resolved = await orgResolver(clientInput);
            const organizationIds = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];

            if (organizationIds.length === 0) {
                await setToastServer({ type: 'error', message: t('forbidden') });
                throw new Error(t('forbidden'));
            }

            for (const organizationId of organizationIds) {
                const orgRole = await getCallerOrgRole(ctx.session.user.id, organizationId);
                if (!orgRole || !hasOrgPermission(orgRole, resource as OrgPermissionResource, action as string)) {
                    await setToastServer({ type: 'error', message: t('forbidden') });
                    throw new Error(t('forbidden'));
                }
            }

            return next({ ctx });
        }

        if (!hasPermission(role, resource, action)) {
            await setToastServer({ type: 'error', message: t('forbidden') });
            throw new Error(t('forbidden'));
        }
        return next({ ctx });
    });

export const preventInfrastructureNetworkAction = createMiddleware().define(
    async ({ clientInput, next }) => {
        const input = clientInput as { action?: string; networkIds?: string[] };

        if (input.networkIds?.length) {
            for (const networkId of input.networkIds) {
                const info = await kyDocker.get(`networks/${networkId}`).json<{ Name: string }>();
                if (isNexployInfrastructureNetworkName(info.Name)) {
                    throw new Error(`Cannot ${input.action} infrastructure network "${info.Name}"`);
                }
            }
        }

        return next();
    },
);

export const preventSelfAction = createMiddleware<{
    ctx: { session: Session };
}>().define(async ({ ctx, clientInput, next }) => {
    const input = clientInput as { userId?: string };
    const tAdmin = await getTranslations('admin');

    if (input.userId && input.userId === ctx.session.user.id) {
        await setToastServer({
            type: 'error',
            message: tAdmin('cannotBanYourself'),
        });
    }

    return next({ ctx });
});
