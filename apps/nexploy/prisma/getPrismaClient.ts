import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';

export const getPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL as string;
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
};
