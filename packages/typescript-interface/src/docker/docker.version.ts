export interface Version {
    imageTag: string;
    repositoryId: string;
    buildId: string;
    versionNumber: number;
    commitHash?: string;
    commitMessage?: string;
    branch?: string;
    buildType: string;
    createdAt: number;
    imageId: string;
    imageFullName: string;
}
