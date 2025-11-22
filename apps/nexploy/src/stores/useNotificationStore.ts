import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
    containerToast: boolean;
    setContainerToast: (enabled: boolean) => void;
}

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
