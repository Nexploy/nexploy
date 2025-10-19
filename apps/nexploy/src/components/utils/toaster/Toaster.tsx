import { cookies } from 'next/headers';
import { ClientToasts } from '@/components/utils/toaster/ClientToasts';
import { ToastData, ToastItem } from '@workspace/typescript-interface/toast';

export async function Toaster() {
    const cookieStore = await cookies();
    const toasts = cookieStore
        .getAll()
        .filter((cookie) => cookie.name.startsWith('toast-') && cookie.value)
        .map((cookie) => {
            const data: ToastData = JSON.parse(cookie.value);

            return {
                id: cookie.name,
                ...data,
                dismiss: async () => {
                    'use server';
                    const cookieStore = await cookies();
                    cookieStore.delete(cookie.name);
                },
            } as ToastItem;
        });

    return <ClientToasts toasts={toasts} />;
}
