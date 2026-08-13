import type { ContainerImageTransfer } from './docker.container';

export type ComposesAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'remove';

export interface StackMigratedContainer {
    id: string;
    name: string;
    imageTransfer: ContainerImageTransfer;
    started: boolean;
    migratedVolumes: string[];
}

export interface StackMigrationResult {
    stackName: string;
    targetEnvironmentId: string;
    containers: StackMigratedContainer[];
    warnings: string[];
}
