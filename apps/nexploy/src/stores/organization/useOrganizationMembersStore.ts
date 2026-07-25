import { create } from 'zustand';
import type { OrganizationMembersState } from '@workspace/typescript-interface/stores/organizationStore';
import type {
    OrganizationInvitation,
    OrganizationMember,
} from '@workspace/typescript-interface/organization/organization';

export const useOrganizationMembersStore = create<OrganizationMembersState>((set, get) => ({
    organizationId: null,
    members: [],
    invitations: [],

    setMembers: (organizationId, members, invitations) =>
        set({ organizationId, members, invitations }),

    removeMember: (memberId) => {
        set((state) => ({
            members: state.members.filter((member) => member.id !== memberId),
        }));
    },

    updateMemberRole: (memberId, role) => {
        set((state) => ({
            members: state.members.map((member) =>
                member.id === memberId ? { ...member, role } : member,
            ),
        }));
    },

    addInvitation: (invitation) => {
        set((state) => ({
            invitations: [
                invitation,
                ...state.invitations.filter((existing) => existing.id !== invitation.id),
            ],
        }));
    },

    removeInvitation: (invitationId) => {
        set((state) => ({
            invitations: state.invitations.filter((invitation) => invitation.id !== invitationId),
        }));
    },

    getOwnerCount: () => get().members.filter((member) => member.role === 'owner').length,
}));

export const initializeOrganizationMembersStore = (
    organizationId: string,
    members: OrganizationMember[],
    invitations: OrganizationInvitation[],
) => {
    useOrganizationMembersStore.setState({ organizationId, members, invitations });
};
