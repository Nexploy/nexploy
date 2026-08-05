import { createMiddleware, createSafeActionClient } from 'next-safe-action';
import { getUserSession } from '@/services/auth/auth.service';
import { Session } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';
import { hasPermission, type PermissionActions, type PermissionResource } from '@/lib/auth/permissions';
import { canOnOwnedResource } from '@/lib/auth/canOnOwnedResource';
import { isOrgScopedResource, type OrgScopedResource } from '@/lib/auth/orgScopedResources';
import { getCallerOrgRole, HOST_OWNED, HOST_SCOPED, type OrgScopeResolver } from '@/lib/auth/resolveOrgContext';
import { kyDocker } from '@/lib/api/kyDocker';
import { isNexployInfrastructureNetworkName } from '@nexploy/shared/nexployFilter';
import { z } from 'zod';
import { unstable_rethrow } from 'next/navigation';
import type { ActivityStatus } from '@workspace/typescript-interface/activity';
import { recordActivity } from '@/lib/activity/recordActivity';
import { markErrorKind, runWithErrorKind, wasForbidden } from '@/lib/activity/actionAudit';
import { ForbiddenError, isForbiddenError } from '@/lib/activity/forbiddenError';
import type { OrgScopeArgs } from '@workspace/typescript-interface/auth/orgScope';

export const actionServer = createSafeActionClient({
    defineMetadataSchema: () => z.object({ name: z.string() }),
    handleServerError(error) {
        console.error(`[ACTION ERROR] ${error.message}`);
        markErrorKind(error);
        return error.message || 'Error occurred';
    },
}).use(async ({ next, metadata, clientInput }) => {
    const startedAt = Date.now();

    const record = (status: ActivityStatus, errorMessage?: string) =>
        recordActivity({
            name: metadata.name,
            source: 'SERVER_ACTION',
            status,
            input: clientInput,
            durationMs: Date.now() - startedAt,
            errorMessage,
        });

    return runWithErrorKind(async () => {
        try {
            const result = await next();

            if (result.serverError) {
                await record(wasForbidden() ? 'DENIED' : 'FAILURE', String(result.serverError));
            } else if (result.validationErrors) {
                await record('FAILURE', 'Validation failed');
            } else {
                await record('SUCCESS');
            }

            return result;
        } catch (error) {
            unstable_rethrow(error);

            await record(
                isForbiddenError(error) ? 'DENIED' : 'FAILURE',
                error instanceof Error ? error.message : undefined,
            );
            throw error;
        }
    });
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
    ...[orgResolver]: OrgScopeArgs<R, OrgScopedResource, OrgScopeResolver>
) =>
    createMiddleware<{ ctx: { session: Session } }>().define(
        async ({ ctx, clientInput, bindArgsClientInputs, next }) => {
            const role = ctx.session.user.role as string;
            const t = await getTranslations('common');

            const deny = async (): Promise<Error> => {
                await setToastServer({ type: 'error', message: t('forbidden') });
                return new ForbiddenError(t('forbidden'));
            };

            if (isOrgScopedResource(resource) && role !== 'admin' && orgResolver !== HOST_SCOPED) {
                if (!orgResolver) throw await deny();

                const resolved = await orgResolver(clientInput, bindArgsClientInputs, ctx.session);
                const organizationIds = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];

                if (organizationIds.length === 0) throw await deny();

                for (const organizationId of organizationIds) {
                    const owner = organizationId === HOST_OWNED ? null : organizationId;
                    const orgRole = owner ? await getCallerOrgRole(ctx.session.user.id, owner) : null;

                    if (!canOnOwnedResource({ role, orgRole, organizationId: owner }, resource, action, owner)) {
                        throw await deny();
                    }
                }

                return next({ ctx });
            }

            if (!hasPermission(role, resource, action)) throw await deny();

            return next({ ctx });
        },
    );

export const preventInfrastructureNetworkAction = createMiddleware().define(async ({ clientInput, next }) => {
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
});

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
