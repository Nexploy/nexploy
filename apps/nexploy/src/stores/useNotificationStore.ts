import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    DockerToastCategory,
    NotificationState,
} from '@workspace/typescript-interface/stores/notificationStore';

const defaultCategories: Record<DockerToastCategory, boolean> = {
    containers: true,
    images: true,
    volumes: true,
    networks: true,
    swarm: true,
};

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            categories: defaultCategories,
            setCategoryEnabled: (category, enabled) =>
                set((state) => ({
                    categories: { ...state.categories, [category]: enabled },
                })),
            isCategoryEnabled: (category) => get().categories[category],
        }),
        {
            name: 'notification-storage',
        },
    ),
);
