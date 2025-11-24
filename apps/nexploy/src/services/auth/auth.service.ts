import { auth, Session } from '@/lib/auth/auth';
import { User } from 'better-auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { prisma } from '../../../prisma/prisma';
import { getTranslations } from 'next-intl/server';
import { redirect, RedirectType } from 'next/navigation';
import { TypeChangeUsernameFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { SocialAccount } from '@workspace/typescript-interface/auth/social-account';

export async function getUserSession(): Promise<Session | null> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
            asResponse: true,
        });

        const parseRes = await session.json();

        return parseRes ?? null;
    } catch {
        return null;
    }
}

export async function signInUser(email: string, password: string): Promise<User> {
    const t = await getTranslations('auth');

    const resSignIn = await auth.api.signInEmail({
        body: {
            email,
            password,
        },
        asResponse: true,
    });

    const parseRes = await resSignIn.json();

    if (parseRes.twoFactorRedirect) redirect('/2fa', RedirectType.push);

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes.user;
}

export async function isAdminExist() {
    try {
        const userAdmin = await prisma.user.findFirst({
            where: {
                role: 'admin',
            },
            select: {
                id: true,
            },
        });

        return !!userAdmin;
    } catch {
        await setToastServer({
            type: 'error',
            message: 'Errored while checking if admin exists.',
        });
    }
}

export async function changeUsername({ newName }: TypeChangeUsernameFormSchema) {
    const t = await getTranslations('auth');

    const resSignIn = await auth.api.updateUser({
        body: {
            name: newName,
        },
        headers: await headers(),
        asResponse: true,
    });

    const parseRes = await resSignIn.json();

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes.user;
}

export async function listAccount(): Promise<SocialAccount[]> {
    const t = await getTranslations('auth');

    const resListUserAccount = await auth.api.listUserAccounts({
        headers: await headers(),
        asResponse: true,
    });

    const parseRes = await resListUserAccount.json();

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes as unknown as SocialAccount[];
}

