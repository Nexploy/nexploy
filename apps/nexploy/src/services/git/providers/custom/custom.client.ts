export interface RemoteRef {
    name: string;
    sha: string;
}

export interface RemoteRefs {
    branches: RemoteRef[];
    defaultBranch: string | null;
}

const UPLOAD_PACK_SUFFIX = '/info/refs?service=git-upload-pack';

const FETCH_TIMEOUT_MS = 15_000;

export function normalizeRepositoryUrl(repositoryUrl: string): string {
    const trimmed = repositoryUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('.git') ? trimmed.slice(0, -4) : trimmed;
}

function parsePacketLines(payload: string): string[] {
    const lines: string[] = [];
    let cursor = 0;

    while (cursor + 4 <= payload.length) {
        const length = Number.parseInt(payload.slice(cursor, cursor + 4), 16);

        if (Number.isNaN(length)) break;

        if (length === 0) {
            cursor += 4;
            continue;
        }

        lines.push(payload.slice(cursor + 4, cursor + length));
        cursor += length;
    }

    return lines;
}

function defaultBranchFromCapabilities(line: string): string | null {
    const symref = /symref=HEAD:refs\/heads\/([^\s\0]+)/.exec(line);
    return symref?.[1] ?? null;
}

export async function fetchRemoteRefs(repositoryUrl: string): Promise<RemoteRefs> {
    const endpoint = `${normalizeRepositoryUrl(repositoryUrl)}${UPLOAD_PACK_SUFFIX}`;

    const response = await fetch(endpoint, {
        headers: { 'user-agent': 'git/2.43.0' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: 'follow',
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error('REPOSITORY_NOT_PUBLIC');
    }

    if (!response.ok) {
        throw new Error('REPOSITORY_UNREACHABLE');
    }

    const lines = parsePacketLines(await response.text());

    const branches: RemoteRef[] = [];
    let defaultBranch: string | null = null;

    for (const line of lines) {
        if (!defaultBranch) defaultBranch = defaultBranchFromCapabilities(line);

        const match = /^([0-9a-f]{40})\s+refs\/heads\/([^\s\0]+)/.exec(line);
        if (!match?.[1] || !match[2]) continue;

        branches.push({ sha: match[1], name: match[2] });
    }

    if (branches.length === 0) {
        throw new Error('REPOSITORY_UNREACHABLE');
    }

    return {
        branches,
        defaultBranch: defaultBranch ?? branches.find((branch) => branch.name === 'main')?.name ?? branches[0]!.name,
    };
}
