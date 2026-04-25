import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationState } from '@workspace/typescript-interface/stores/notificationStore';

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            showContainerToast: true,
            setShowContainerToast: (enabled) => set({ showContainerToast: enabled }),
        }),
        {
            name: 'notification-storage',
        },
    ),
);
