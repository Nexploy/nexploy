import { auth } from '@/lib/auth/auth';
import type { Role } from '@/lib/auth/permissions';
import type { OrgRole } from '@/lib/auth/orgPermissions';
import { setTestHeaders } from './nextMocks';

export const TEST_PASSWORD = 'Password123!';

export const GLOBAL_ROLES: Role[] = ['guest', 'developer', 'admin', 'system'];
export const ORG_ROLES: OrgRole[] = ['owner', 'admin', 'member'];

export interface TestUser {
    id: string;
    email: string;
    name: string;
    role: Role;
    organizationId: string | null;
    orgRole: OrgRole | null;
}

let currentCookie: string | null = null;

export function currentSessionCookie(): string | null {
    return currentCookie;
}

export async function loginAs(user: TestUser): Promise<void> {
    const response = await auth.api.signInEmail({
        body: { email: user.email, password: TEST_PASSWORD },
        asResponse: true,
    });

    const setCookie = response.headers.get('set-cookie');

    if (!setCookie) {
        throw new Error(`Could not sign in the test user ${user.email} (status ${response.status})`);
    }

    currentCookie = setCookie
        .split(/,(?=[^;]+=)/)
        .map((part) => (part.split(';')[0] ?? '').trim())
        .join('; ');

    setTestHeaders({ cookie: currentCookie });
}

export function logout() {
    currentCookie = null;
    setTestHeaders({ cookie: '' });
}
