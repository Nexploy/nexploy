import { prisma } from '../../prisma/prisma';
import { UserRow } from '@/components/admin/users/ColumnsUsers';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function getUsers(): Promise<UserRow[]> {
    const t = await getErrorTranslator();
    try {
        return await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                banned: true,
                banReason: true,
                createdAt: true,
                image: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    } catch {
        throw new Error(t('user.getUsersFailed'));
    }
}
