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
