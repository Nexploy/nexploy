import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { getAllEnvsBuild } from '@/services/repository/build.service';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { NodeExecutionContext } from '@workspace/typescript-interface/pipeline/pipeline';

export function getComposeProjectName(repositoryId: string): string {
    return `nexploy-${repositoryId}`;
}

export async function resolveComposeEnvVars(ctx: NodeExecutionContext<unknown>): Promise<Record<string, string>> {
    const { buildConfig, allOutputs, edges, nodeId } = ctx;

    const repoEnvs = buildConfig.stageId ? await getAllEnvsBuild(buildConfig.stageId) : [];
    const repoEnvMap = Object.fromEntries(repoEnvs.map((e) => [e.key, e.value]));

    const ancestorEnvVarsArray =
        getFromClosestAncestor<{ key: string; value: string }[]>(allOutputs, edges, nodeId, 'envVariables') ?? [];
    const ancestorEnvMap = Object.fromEntries(ancestorEnvVarsArray.map((e) => [e.key, e.value]));

    return { ...repoEnvMap, ...ancestorEnvMap };
}

export function resolveComposeLabels(ctx: NodeExecutionContext<unknown>): Record<string, string> {
    const { buildConfig, allOutputs, edges, nodeId } = ctx;

    const branch = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'branch');
    const commitHash = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'commitHash');
    const commitMessage = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'commitMessage');

    return {
        [NEXPLOY_LABELS.repositoryId]: buildConfig.repositoryId,
        [NEXPLOY_LABELS.buildId]: buildConfig.buildId,
        ...(branch && { [NEXPLOY_LABELS.branch]: branch }),
        ...(commitHash && { [NEXPLOY_LABELS.commitHash]: commitHash }),
        ...(commitMessage && { [NEXPLOY_LABELS.commitMessage]: commitMessage }),
    };
}

export function requireComposeFileFromAncestor(ctx: NodeExecutionContext<unknown>): {
    composeFile: string;
    projectName: string;
} {
    const { allOutputs, edges, nodeId, buildConfig } = ctx;

    const composeFile = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'composeFile');

    if (!composeFile) {
        throw new Error('No composeFile found in input nodes — connect this node after a Compose Build node');
    }

    const projectName =
        getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'projectName') ??
        getComposeProjectName(buildConfig.repositoryId);

    return { composeFile, projectName };
}
