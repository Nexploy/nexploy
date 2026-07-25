export type DockerToastCategory = 'containers' | 'images' | 'volumes' | 'networks' | 'swarm';

export type NotificationBadgeCategory = 'invitations';

export type NotificationBadgeNode = 'accountMenu' | 'account' | 'invitations';

export interface NotificationBadgeTarget {
    href: string;
    path: NotificationBadgeNode[];
    labelKey: string;
    descriptionKey: string;
}

export interface NotificationState {
    categories: Record<DockerToastCategory, boolean>;
    badges: Record<NotificationBadgeCategory, boolean>;
    setCategoryEnabled: (category: DockerToastCategory, enabled: boolean) => void;
    setBadgeEnabled: (category: NotificationBadgeCategory, enabled: boolean) => void;
    isCategoryEnabled: (category: DockerToastCategory) => boolean;
    isBadgeEnabled: (category: NotificationBadgeCategory) => boolean;
}
