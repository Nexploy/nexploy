'use client';

import { startTransition, useEffect, useOptimistic, useState } from 'react';
import { Toaster } from '@workspace/ui/components/sonner';
import { toast as sonnerToast } from 'sonner';

type Toast = {
    id: string;
    message: string;
    dismiss: () => Promise<void>;
};

export function ClientToaster({ toasts }: { toasts: Toast[] }) {
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
                sonnerToast(toast.message, {
                    id: toast.id,
                    onDismiss: () => startTransition(toast.dismiss),
                    onAutoClose: () => startTransition(toast.dismiss),
                    position: 'top-right',
                });
            });
    }, [localToasts, sentToSonner]);

    return <Toaster />;
}
