import { User } from 'better-auth';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '../../../prisma/prisma';
import { TypeCreateUserFormSchema } from '@workspace/schemas-zod/auth/auth.schema';

export async function createUser(
    { email, password, role, name }: TypeCreateUserFormSchema,
    creatorId: string,
): Promise<User> {
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

    if (role === 'admin') {
        await prisma.user.update({
            where: { id: parseRes.user.id },
            data: { promotedById: creatorId },
        });
    }

    return parseRes.user;
}
