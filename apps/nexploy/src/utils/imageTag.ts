import type { RepoTag } from '@workspace/typescript-interface/docker/docker.image';

export function splitRepoTag(repoTag: string | undefined): RepoTag {
    if (!repoTag) return { repo: '', tag: 'latest' };

    const lastColon = repoTag.lastIndexOf(':');
    if (lastColon === -1) return { repo: repoTag, tag: 'latest' };

    return { repo: repoTag.slice(0, lastColon), tag: repoTag.slice(lastColon + 1) };
}
