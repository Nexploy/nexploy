'use client';

import type {
    NotificationBadgeCategory,
    NotificationBadgeNode,
} from '@workspace/typescript-interface/stores/notificationStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useOrganizationStore } from '@/stores/organization/useOrganizationStore';
import { notificationBadgeCategories, notificationBadgeTargets } from '@/lib/notifications/notificationBadges';

function useNotificationBadgeCounts(): Record<NotificationBadgeCategory, number> {
    const pendingInvitations = useOrganizationStore((s) => s.pendingInvitations.length);

    return { invitations: pendingInvitations };
}

export function useNotificationBadgeCount(node: NotificationBadgeNode): number {
    const counts = useNotificationBadgeCounts();
    const badges = useNotificationStore((s) => s.badges);

    return notificationBadgeCategories.reduce((total, category) => {
        if (!badges[category] || !notificationBadgeTargets[category].path.includes(node)) return total;

        return total + counts[category];
    }, 0);
}
