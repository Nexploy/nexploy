export interface DeploymentStage {
    id: string;
    name: string;
    isProduction: boolean;
    repositoryId: string;
    environmentId: string | null;
    requiredStageId: string | null;
    createdAt: string;
    updatedAt: string;
}
