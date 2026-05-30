import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationState } from '@workspace/typescript-interface/stores/notificationStore';

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            showContainerToast: true,
            setShowContainerToast: (enabled) => set({ showContainerToast: enabled }),
            showImageToast: true,
            setShowImageToast: (enabled) => set({ showImageToast: enabled }),
            showVolumeToast: true,
            setShowVolumeToast: (enabled) => set({ showVolumeToast: enabled }),
            showBuildToast: true,
            setShowBuildToast: (enabled) => set({ showBuildToast: enabled }),
        }),
        {
            name: 'notification-storage',
        },
    ),
);
