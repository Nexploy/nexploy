import { getUserSession } from '@/services/auth/auth.service';
import { getUserOrganizations } from '@/services/organization.service';
import { DropdownOrganization } from '@/components/sidebar/organization/DropdownOrganization';

export async function Organization() {
    const session = await getUserSession();
    if (!session) return null;

    const organizations = await getUserOrganizations(session.user.id);
    const activeOrganizationId =
        (session.session as { activeOrganizationId?: string | null }).activeOrganizationId ??
        organizations[0]?.id ??
        null;

    return (
        <DropdownOrganization
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
        />
    );
}
