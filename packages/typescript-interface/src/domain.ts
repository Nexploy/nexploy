import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';

export interface DomainOperations {
    add: Domain[];
    edit: Domain[];
    delete: Domain[];
    unchanged: Domain[];
}

export interface ApplyDomainOperationsInput {
    repositoryId: string;
    userId: string;
    operations: DomainOperations;
}
