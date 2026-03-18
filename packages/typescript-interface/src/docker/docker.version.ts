export interface Version {
    imageTag: string;
    repositoryId: string;
    buildId: string;
    versionNumber: number;
    commitHash?: string;
    commitMessage?: string;
    branch?: string;
    createdAt: number;
    imageId: string;
    imageFullName: string;
    environmentId?: string;
    environmentName?: string;
    hasComposeConfig?: boolean;
}
