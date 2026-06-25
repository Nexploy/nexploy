import { toast } from 'sonner';
import { DockerToastCategory } from '@workspace/typescript-interface/stores/notificationStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

type ToastLevel = 'success' | 'error' | 'info' | 'warning';
type ToastOptions = Parameters<(typeof toast)['success']>[1];

export function notifyDocker(
    category: DockerToastCategory,
    level: ToastLevel,
    message: string,
    options?: ToastOptions,
) {
    if (!useNotificationStore.getState().isCategoryEnabled(category)) return;
    toast[level](message, options);
}
