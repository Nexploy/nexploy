import { User } from 'better-auth';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { TypeCreateUserFormSchema } from '@workspace/schemas-zod/auth/auth.schema';

export async function createUser({
    email,
    password,
    role,
    name,
}: TypeCreateUserFormSchema): Promise<User> {
    const t = await getTranslations('auth');

    const resSignIn = await auth.api.createUser({
        body: {
            name,
            email,
            password,
            role,
        },
        asResponse: true,
    });

    const parseRes = await resSignIn.json();

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return parseRes.user;
}
