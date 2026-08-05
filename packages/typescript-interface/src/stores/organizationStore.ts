import type {
    OrganizationInvitation,
    OrganizationMember,
    PendingInvitation,
    UserOrganization,
} from '../organization/organization.js';

export interface OrganizationState {
    organizations: UserOrganization[];
    activeOrganizationId: string | null;
    pendingInvitations: PendingInvitation[];
    pendingInvitationsInitialized: boolean;

    setOrganizations: (organizations: UserOrganization[]) => void;
    selectOrganization: (organizationId: string) => void;
    addOrganization: (organization: UserOrganization) => void;
    updateOrganization: (organizationId: string, data: Partial<UserOrganization>) => void;
    removeOrganization: (organizationId: string) => void;

    setPendingInvitations: (invitations: PendingInvitation[]) => void;
    removePendingInvitation: (invitationId: string) => void;

    getActiveOrganization: () => UserOrganization | undefined;
    getOrganization: (organizationId: string) => UserOrganization | undefined;
}

export interface OrganizationMembersState {
    organizationId: string | null;
    members: OrganizationMember[];
    invitations: OrganizationInvitation[];

    setMembers: (organizationId: string, members: OrganizationMember[], invitations: OrganizationInvitation[]) => void;
    removeMember: (memberId: string) => void;
    updateMemberRole: (memberId: string, role: string) => void;
    addInvitation: (invitation: OrganizationInvitation) => void;
    removeInvitation: (invitationId: string) => void;

    getOwnerCount: () => number;
}
