'use client';

import { useLayoutEffect } from 'react';
import type { PendingInvitation } from '@workspace/typescript-interface/organization/organization';
import { initializePendingInvitations } from '@/stores/organization/useOrganizationStore';

interface PendingInvitationsStoreInitializerProps {
    invitations: PendingInvitation[];
}

export function PendingInvitationsStoreInitializer({ invitations }: PendingInvitationsStoreInitializerProps) {
    useLayoutEffect(() => initializePendingInvitations(invitations), [invitations]);

    return null;
}
