import type {
    RunnerAvailability,
    RunnerBuildRequest,
    RunnerBuildResult,
    RunnerDispatchOptions,
} from '@nexploy/nodes/core/nodeServices';
import { getBuildRunnerById } from '@/services/buildRunner.service';
import { getRegistryWithPassword } from '@/services/registry.service';
import { getGitAdapter } from '@/services/git/core/registry';
import { getGitProviderToken, getValidToken } from '@/services/git/core/token.service';
import type { RunnerGitCredentials, RunnerJobPush, RunnerJobSpec } from '@/server/runner/protocol';
import { dispatchJob, isRunnerOnline } from '@/server/runner/runnerHub';

export async function checkRunnerAvailability(runnerId: string): Promise<RunnerAvailability> {
    const runner = await getBuildRunnerById(runnerId);

    if (!runner) return { available: false, reason: 'runner not found' };
    if (!runner.enabled) return { available: false, reason: 'runner disabled' };
    if (!isRunnerOnline(runnerId)) return { available: false, reason: 'runner offline' };

    return { available: true };
}

async function resolveGitCredentials(
    buildConfig: RunnerBuildRequest['buildConfig'],
): Promise<RunnerGitCredentials | null> {
    const stored = await getGitProviderToken(buildConfig.gitProvider, {
        gitAccountId: buildConfig.gitAccountId,
        requestedUserId: buildConfig.userId,
    });

    const { accessToken } = await getValidToken(
        stored,
        buildConfig.gitProvider,
        buildConfig.userId,
        buildConfig.gitAccountId,
    );

    if (!accessToken) return null;

    return {
        username: getGitAdapter(buildConfig.gitProvider).cloneCredentialUsername,
        token: accessToken,
    };
}

async function resolvePush(
    registryId: string | undefined,
    imageName: string,
    commitHash: string | undefined,
): Promise<RunnerJobPush | null> {
    if (!registryId) return null;

    const registry = await getRegistryWithPassword(registryId);

    if (!registry) {
        throw new Error('The registry configured on the Build Runner node no longer exists');
    }

    const [repository] = imageName.split(':');
    const tags = [commitHash ?? 'latest'];

    return {
        registry: {
            url: registry.url,
            username: registry.username ?? '',
            password: registry.password ?? '',
        },
        repository: repository as string,
        tags,
    };
}

export async function dispatchRunnerBuild(
    request: RunnerBuildRequest,
    options: RunnerDispatchOptions,
): Promise<RunnerBuildResult> {
    const availability = await checkRunnerAvailability(request.runnerId);

    if (!availability.available) {
        throw new Error(`Build runner unavailable: ${availability.reason}`);
    }

    const credentials = await resolveGitCredentials(request.buildConfig);
    const push = await resolvePush(request.registryId, request.build.imageName, request.commitHash);

    const spec: Omit<RunnerJobSpec, 'jobId'> = {
        buildId: request.buildConfig.buildId,
        repositoryId: request.buildConfig.repositoryId,
        nodeId: request.nodeId,
        source: {
            type: 'git',
            url: request.buildConfig.gitUrl,
            branch: request.branch ?? request.buildConfig.gitBranch,
            commitHash: request.commitHash,
            submodules: request.submodules,
            credentials,
        },
        build: request.build,
        push,
        timeoutMs: request.timeoutMs,
    };

    const result = await dispatchJob(
        request.runnerId,
        spec,
        {
            onLog: (message) => {
                void options.onLog(message);
            },
            refreshCredentials: () => resolveGitCredentials(request.buildConfig),
        },
        options.signal,
    );

    return {
        imageId: result.imageId,
        imageName: result.imageName ?? request.build.imageName,
        pushedImages: result.pushedImages,
        digest: result.digest,
    };
}
