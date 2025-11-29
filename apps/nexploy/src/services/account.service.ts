import { prisma } from '../../prisma/prisma';
import { getUserSession } from '@/services/auth/auth.service';

export async function getUserAccessTokenProvider(gitProvider: string) {
    try {
        const session = await getUserSession();

        const account = await prisma.account.findFirst({
            where: {
                userId: session?.user.id,
                providerId: gitProvider,
            },
            select: { accessToken: true },
        });

        return account?.accessToken;
    } catch (error: unknown) {
        throw new Error('Failed to get user access token');
    }
}
