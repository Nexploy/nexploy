'use client';

import { startTransition, useEffect, useOptimistic, useState } from 'react';
import { Toaster } from '@workspace/ui/components/sonner';
import { toast as sonnerToast } from 'sonner';
import { ToastItem } from '@workspace/typescript-interface/toast';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { cn } from '@workspace/ui/lib/utils.ts';

export function ClientToasts({ toasts }: { toasts: ToastItem[] }) {
    const { showContainerToast } = useNotificationStore();

    const [optimisticToasts, remove] = useOptimistic(toasts, (current, id) =>
        current.filter((toast) => toast.id !== id),
    );

    const localToasts = optimisticToasts.map((toast) => ({
        ...toast,
        dismiss: async () => {
            remove(toast.id);
            await toast.dismiss();
        },
    }));

    const [sentToSonner, setSentToSonner] = useState<string[]>([]);

    useEffect(() => {
        localToasts
            .filter((toast) => !sentToSonner.includes(toast.id))
            .forEach((toast) => {
                setSentToSonner((prev) => [...prev, toast.id]);

                const options = {
                    id: toast.id,
                    description: toast.description,
                    onDismiss: () => startTransition(toast.dismiss),
                    onAutoClose: () => startTransition(toast.dismiss),
                };

                sonnerToast[toast.type](toast.message, options);
            });
    }, [localToasts, sentToSonner]);

    return (
        <div className={cn(showContainerToast ? 'flex' : 'flex-none')}>
            <Toaster />
        </div>
    );
}
