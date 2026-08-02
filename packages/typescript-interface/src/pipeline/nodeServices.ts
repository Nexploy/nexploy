import type { BuildConfig } from '../repository/build';
import type { GitProviderToken } from '../git/git';

export interface DockerRequestOptions {
    json?: unknown;
    searchParams?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
    timeout?: number | false;
    signal?: AbortSignal;
    throwHttpErrors?: boolean;
    environmentId?: string;
}

export interface DockerResponsePromise extends Promise<Response> {
    json<T>(): Promise<T>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}

export interface DockerApiClient {
    get(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    post(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    put(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    patch(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    delete(url: string, options?: DockerRequestOptions): DockerResponsePromise;
}

export interface StageEnvVariable {
    key: string;
    value: string;
}

export interface StartedBuild {
    id: string;
    numberBuild: number;
}

export interface StartStageBuildInput {
    repositoryId: string;
    branch?: string;
    stageId: string;
    userId: string;
    triggeredByStageId?: string;
}

export interface StageRef {
    id: string;
    name: string;
}

export interface BuildHostService {
    getStageEnvVariables(stageId: string): Promise<StageEnvVariable[]>;
    updateGitInfo(buildId: string, branch: string, commitHash?: string, commitMessage?: string): Promise<void>;
    startStageBuild(input: StartStageBuildInput): Promise<StartedBuild | null>;
    findStage(repositoryId: string, stageId: string): Promise<StageRef | null>;
}

export interface GitRepoRef {
    baseUrl: string;
    owner: string;
    repo: string;
}

export interface CreateReleaseInput {
    tagName: string;
    targetBranch: string;
    title: string;
    notes: string;
    draft: boolean;
    prerelease: boolean;
}

export interface CommitStatusInput {
    sha: string;
    state: 'pending' | 'success' | 'failure' | 'error';
    description?: string;
    context: string;
}

export interface GitHostService {
    workDirRoot: string;
    resolveToken(buildConfig: BuildConfig, manualToken?: string): Promise<GitProviderToken>;
    refreshToken(buildConfig: BuildConfig, expiredToken: GitProviderToken): Promise<GitProviderToken>;
    getCloneCredentialUsername(provider: BuildConfig['gitProvider']): string;
    parseRepoUrl(provider: BuildConfig['gitProvider'], gitUrl: string): GitRepoRef;
    createRelease(
        buildConfig: BuildConfig,
        input: CreateReleaseInput,
    ): Promise<{ releaseId: string; releaseUrl: string }>;
    updateCommitStatus(buildConfig: BuildConfig, input: CommitStatusInput): Promise<void>;
}

export interface RegistryCredentials {
    id: string;
    name: string;
    url: string;
    username: string | null;
    password: string | null;
}

export interface RegistryHostService {
    getCredentials(registryId: string): Promise<RegistryCredentials | null>;
}

export interface DomainRoute {
    host: string;
    id?: string;
    cloudflareDnsRecordId?: string;
}

export interface DomainHostService {
    listDomains(): Promise<DomainRoute[]>;
    getDomainKey(host: string): string;
    applyDomains(domains: DomainRoute[]): Promise<void>;
    provisionDns(domain: DomainRoute, host: string): Promise<string | undefined>;
}

export interface SslHostService {
    createLetsEncryptCertificate(name: string, domain: string, email: string): Promise<{ id: string }>;
    createCustomCertificate(
        name: string,
        domain: string,
        certificate: string,
        privateKey: string,
    ): Promise<{ id: string }>;
}

export interface BucketStorageHostService {
    putObject(accountId: string, bucket: string, key: string, body: Uint8Array, contentType: string): Promise<void>;
}

export interface SaveVersionInput {
    repositoryId: string;
    imageTag: string;
    versionNumber: number;
    branch?: string;
    commitHash?: string;
    commitMessage?: string;
    environmentId?: string;
    stageId?: string;
    composeConfig?: string;
}

export interface VersionHostService {
    getNextVersionNumber(repositoryId: string, environmentId?: string): Promise<number>;
    saveVersion(input: SaveVersionInput): Promise<void>;
}

export interface EnvironmentHostService {
    getDefaultEnvironmentId(): Promise<string | undefined>;
}

export interface WebhookClientService {
    setup(repositoryId: string): Promise<void>;
    teardown(repositoryId: string): Promise<void>;
}

export interface NodeClientServices {
    webhook: WebhookClientService;
}

export interface NodeHostServices {
    docker: DockerApiClient;
    build: BuildHostService;
    git: GitHostService;
    registry: RegistryHostService;
    domain: DomainHostService;
    ssl: SslHostService;
    bucketStorage: BucketStorageHostService;
    version: VersionHostService;
    environment: EnvironmentHostService;
}
