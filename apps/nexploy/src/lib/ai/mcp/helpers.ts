import { hasPermission, type PermissionResource } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { isOrgScopedResource } from '@/lib/auth/orgScopedResources';
import {
    getCallerOrgRole,
    resolveOrganizationIdForBuild,
    resolveOrganizationIdForContainer,
    resolveOrganizationIdForRepository,
} from '@/lib/auth/resolveOrgContext';
import type { ToolContext } from './types';

export function ok(text: string) {
    return { content: [{ type: 'text' as const, text }] };
}

export function fail(error: string) {
    return { content: [{ type: 'text' as const, text: `Error: ${error}` }], isError: true };
}

export function guard(ctx: ToolContext, resource: PermissionResource, action: string) {
    if (!hasPermission(ctx.role, resource, action)) {
        return fail(`Permission denied: requires ${resource}.${action}`);
    }
    return null;
}

export async function guardOrganization(
    ctx: ToolContext,
    resource: PermissionResource,
    action: string,
    organizationId: string | null,
) {
    if (!isOrgScopedResource(resource) || ctx.role === 'admin') {
        return guard(ctx, resource, action);
    }

    if (!organizationId) {
        return fail(`Permission denied: requires ${resource}.${action}`);
    }

    const orgRole = await getCallerOrgRole(ctx.userId, organizationId);
    if (!orgRole || !hasOrgPermission(orgRole, resource as OrgPermissionResource, action)) {
        return fail(`Permission denied: requires ${resource}.${action}`);
    }

    return null;
}

export async function guardRepository(
    ctx: ToolContext,
    repositoryId: string,
    resource: PermissionResource,
    action: string,
) {
    return guardOrganization(
        ctx,
        resource,
        action,
        await resolveOrganizationIdForRepository(repositoryId),
    );
}

export async function guardContainer(
    ctx: ToolContext,
    containerId: string,
    resource: PermissionResource,
    action: string,
) {
    return guardOrganization(
        ctx,
        resource,
        action,
        await resolveOrganizationIdForContainer(containerId),
    );
}

export async function guardDestructiveContainer(
    ctx: ToolContext,
    containerId: string,
    resource: PermissionResource,
    action: string,
    target: string,
) {
    const permissionError = await guardContainer(ctx, containerId, resource, action);
    if (permissionError) return permissionError;

    return requireConfirmation(ctx, target);
}

export async function guardBuild(
    ctx: ToolContext,
    buildId: string,
    resource: PermissionResource,
    action: string,
) {
    return guardOrganization(ctx, resource, action, await resolveOrganizationIdForBuild(buildId));
}

function requireConfirmation(ctx: ToolContext, target: string) {
    if (ctx.requireDestructiveConfirmation) {
        if (!ctx.confirmedTargets.has(target)) {
            return fail(
                `Confirmation required before this destructive action can run. Call requestConfirmation with target "${target}" first, present it to the user, and only retry this call after they explicitly confirm.`,
            );
        }
        ctx.confirmedTargets.delete(target);
    }
    return null;
}

export function guardDestructive(
    ctx: ToolContext,
    resource: PermissionResource,
    action: string,
    target: string,
) {
    const permissionError = guard(ctx, resource, action);
    if (permissionError) return permissionError;

    return requireConfirmation(ctx, target);
}

export async function guardDestructiveRepository(
    ctx: ToolContext,
    repositoryId: string,
    resource: PermissionResource,
    action: string,
    target: string,
) {
    const permissionError = await guardRepository(ctx, repositoryId, resource, action);
    if (permissionError) return permissionError;

    return requireConfirmation(ctx, target);
}
