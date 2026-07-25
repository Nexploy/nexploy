import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    DockerToastCategory,
    NotificationBadgeCategory,
    NotificationState,
} from '@workspace/typescript-interface/stores/notificationStore';

const defaultCategories: Record<DockerToastCategory, boolean> = {
    containers: true,
    images: true,
    volumes: true,
    networks: true,
    swarm: true,
};

const defaultBadges: Record<NotificationBadgeCategory, boolean> = {
    invitations: true,
};

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            categories: defaultCategories,
            badges: defaultBadges,
            setCategoryEnabled: (category, enabled) =>
                set((state) => ({
                    categories: { ...state.categories, [category]: enabled },
                })),
            setBadgeEnabled: (category, enabled) =>
                set((state) => ({
                    badges: { ...state.badges, [category]: enabled },
                })),
            isCategoryEnabled: (category) => get().categories[category],
            isBadgeEnabled: (category) => get().badges[category],
        }),
        {
            name: 'notification-storage',
            merge: (persistedState, currentState) => {
                const persisted = (persistedState ?? {}) as Partial<NotificationState>;

                return {
                    ...currentState,
                    ...persisted,
                    categories: { ...defaultCategories, ...persisted.categories },
                    badges: { ...defaultBadges, ...persisted.badges },
                };
            },
        },
    ),
);
