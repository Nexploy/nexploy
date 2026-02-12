import { Prisma } from 'generated/client';

export type RepositoryPayload<T extends Prisma.RepositoryInclude | undefined = undefined> =
    T extends Prisma.RepositoryInclude
        ? Prisma.RepositoryGetPayload<{ include: T }>
        : Prisma.RepositoryGetPayload<object>;
