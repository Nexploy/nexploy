import { create } from 'zustand';
import type { OrganizationState } from '@workspace/typescript-interface/stores/organizationStore';
import type { PendingInvitation, UserOrganization } from '@workspace/typescript-interface/organization/organization';

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
    organizations: [],
    activeOrganizationId: null,
    pendingInvitations: [],
    pendingInvitationsInitialized: false,

    setOrganizations: (organizations) => {
        set((state) => ({
            organizations,
            activeOrganizationId: organizations.some((o) => o.id === state.activeOrganizationId)
                ? state.activeOrganizationId
                : (organizations[0]?.id ?? null),
        }));
    },

    selectOrganization: (organizationId) => {
        if (!get().organizations.some((o) => o.id === organizationId)) return;
        set({ activeOrganizationId: organizationId });
    },

    addOrganization: (organization) => {
        set((state) => ({
            organizations: [...state.organizations, organization],
        }));
    },

    updateOrganization: (organizationId, data) => {
        set((state) => ({
            organizations: state.organizations.map((organization) =>
                organization.id === organizationId ? { ...organization, ...data } : organization,
            ),
        }));
    },

    removeOrganization: (organizationId) => {
        set((state) => {
            const organizations = state.organizations.filter((organization) => organization.id !== organizationId);

            return {
                organizations,
                activeOrganizationId:
                    state.activeOrganizationId === organizationId
                        ? (organizations[0]?.id ?? null)
                        : state.activeOrganizationId,
            };
        });
    },

    setPendingInvitations: (pendingInvitations) => set({ pendingInvitations, pendingInvitationsInitialized: true }),

    removePendingInvitation: (invitationId) => {
        set((state) => ({
            pendingInvitations: state.pendingInvitations.filter((invitation) => invitation.id !== invitationId),
        }));
    },

    getActiveOrganization: () => {
        const { organizations, activeOrganizationId } = get();
        return organizations.find((organization) => organization.id === activeOrganizationId) ?? organizations[0];
    },

    getOrganization: (organizationId) => get().organizations.find((organization) => organization.id === organizationId),
}));

export const initializeOrganizationStore = (organizations: UserOrganization[], activeOrganizationId: string | null) => {
    useOrganizationStore.setState({
        organizations,
        activeOrganizationId:
            activeOrganizationId && organizations.some((o) => o.id === activeOrganizationId)
                ? activeOrganizationId
                : (organizations[0]?.id ?? null),
    });
};

export const initializePendingInvitations = (pendingInvitations: PendingInvitation[]) => {
    useOrganizationStore.setState({ pendingInvitations, pendingInvitationsInitialized: true });
};
