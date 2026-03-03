import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUsers } from '@/services/user.service';

const mockFindMany = vi.fn();

vi.mock('../../../prisma/prisma', () => ({
    prisma: { user: { findMany: mockFindMany } },
}));

vi.mock('@/components/admin/users/ColumnsUsers', () => ({}));

describe('getUsers', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns users from Prisma with correct query', async () => {
        const users = [
            {
                id: 'u1',
                name: 'Alice',
                email: 'alice@test.com',
                role: 'admin',
                banned: false,
                banReason: null,
                createdAt: new Date(),
                image: null,
            },
        ];
        mockFindMany.mockResolvedValue(users);

        const result = await getUsers();

        expect(result).toEqual(users);
        expect(mockFindMany).toHaveBeenCalledWith({
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
            orderBy: { createdAt: 'asc' },
        });
    });

    it('throws "Failed to get users" when Prisma rejects', async () => {
        mockFindMany.mockRejectedValue(new Error('DB connection error'));

        await expect(getUsers()).rejects.toThrow('Failed to get users');
    });
});
