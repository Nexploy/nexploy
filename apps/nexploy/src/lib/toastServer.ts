import { cookies } from 'next/headers';

export async function toastServer(message: string) {
    const cookieStore = await cookies();
    const id = crypto.randomUUID();
    cookieStore.set(`toast-${id}`, message, {
        path: '/',
        maxAge: 60 * 60 * 24
    });
}
