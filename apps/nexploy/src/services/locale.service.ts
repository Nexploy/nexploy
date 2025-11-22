'use server';

export async function getUserLocale(defaultLocale = 'fr') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get('NEXT_LOCALE')?.value || defaultLocale;
}

export async function setUserLocale(locale: string) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale);
}
