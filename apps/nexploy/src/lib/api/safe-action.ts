import { createMiddleware, createSafeActionClient } from 'next-safe-action';
import { getUserSession } from '@/services/auth/auth.service';
import { Session } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';
import { hasPermission, type PermissionActions, type PermissionResource } from '@/lib/auth/permissions';
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
) =>
    createMiddleware<{ ctx: { session: Session } }>().define(async ({ ctx, next }) => {
        if (!hasPermission(ctx.session.user.role as string, resource, action as string)) {
            throw new Error(`Forbidden: missing permission ${resource}.${action as string}`);
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
