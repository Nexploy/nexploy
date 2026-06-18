export interface DeploymentStage {
    id: string;
    name: string;
    slug: string;
    isProduction: boolean;
    order: number;
    repositoryId: string;
    environmentId: string | null;
    createdAt: string;
    updatedAt: string;
}
