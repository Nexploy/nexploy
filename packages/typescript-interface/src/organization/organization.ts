export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface UserOrganization {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    role: string;
    canLeave: boolean;
    isPersonal: boolean;
}

export interface OrganizationMember {
    id: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
}

export interface OrganizationInvitation {
    id: string;
    email: string;
    role: string | null;
    createdAt: Date;
}

export interface InvitableUser {
    id: string;
    name: string;
    email: string;
    image: string | null;
}

export interface PendingInvitation {
    id: string;
    role: string;
    inviterEmail: string;
    organization: {
        id: string;
        name: string;
    };
}
