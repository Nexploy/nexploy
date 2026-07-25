import type {
    NotificationBadgeCategory,
    NotificationBadgeTarget,
} from '@workspace/typescript-interface/stores/notificationStore';

export const notificationBadgeCategories: NotificationBadgeCategory[] = ['invitations'];

export const notificationBadgeTargets: Record<NotificationBadgeCategory, NotificationBadgeTarget> =
    {
        invitations: {
            href: '/account#invitations',
            path: ['accountMenu', 'account', 'invitations'],
            labelKey: 'notifications.badges.invitations',
            descriptionKey: 'notifications.badges.invitationsDescription',
        },
    };
