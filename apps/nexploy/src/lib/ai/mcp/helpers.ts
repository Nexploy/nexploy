import { hasPermission, type PermissionResource } from '@/lib/auth/permissions';
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

export function guardDestructive(
    ctx: ToolContext,
    resource: PermissionResource,
    action: string,
    target: string,
) {
    const permissionError = guard(ctx, resource, action);
    if (permissionError) return permissionError;

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
