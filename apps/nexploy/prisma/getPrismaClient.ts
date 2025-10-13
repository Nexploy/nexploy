import { PrismaClient } from 'generated/prisma';

export const getPrismaClient = () => {
    return new PrismaClient({
        // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
};
