import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationState } from '@workspace/typescript-interface/stores/notificationStore';

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            containerToast: true,
            setContainerToast: (enabled) => set({ containerToast: enabled }),
        }),
        {
            name: 'notification-storage',
        },
    ),
);
