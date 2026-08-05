import { prisma } from '../../prisma/prisma';

const PRESERVED_TABLES = new Set(['_prisma_migrations']);

export async function resetDatabase() {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;

    const truncatable = tables.map((t) => t.tablename).filter((name) => !PRESERVED_TABLES.has(name));

    if (truncatable.length === 0) return;

    const list = truncatable.map((name) => `"public"."${name}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function disconnectDatabase() {
    await prisma.$disconnect();
}

export { prisma };
