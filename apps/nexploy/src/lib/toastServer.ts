'use server';

import { cookies } from 'next/headers';
import { ToastData } from '@workspace/typescript-interface/toast';

export async function setToastServer(toast: ToastData) {
    const cookieStore = await cookies();
    const id = crypto.randomUUID();

    cookieStore.set(`toast-${id}`, JSON.stringify(toast), {
        path: '/',
        maxAge: 60 * 60 * 24,
    });
}
