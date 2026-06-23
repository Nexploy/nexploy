import { User } from 'better-auth';
import { auth } from '@/lib/auth/auth';
import { getTranslations } from 'next-intl/server';
import { TypeSetupFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { isAdminExist, signInUser } from '@/services/auth/auth.service';

export async function setupAdminAccount({
    email,
    password,
    name,
}: TypeSetupFormSchema): Promise<User> {
    const t = await getTranslations('auth');

    const hasAdmin = await isAdminExist();
    if (hasAdmin) throw new Error(t('adminAlreadyExists'));

    const resSignIn = await auth.api.createUser({
        body: {
            email,
            name,
            password,
            role: 'admin',
        },
        asResponse: true,
    });

    const parseRes = await resSignIn.json();

    if (parseRes.code) {
        throw new Error(`${parseRes.message} - ${t('errorContactAdmin')}`);
    }

    return await signInUser(email, password);
}
