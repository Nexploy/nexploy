export type DockerAgentStatus = 'OFFLINE' | 'ONLINE';

export interface DockerAgentInfo {
    id: string;
    environmentId: string;
    tokenPrefix: string;
    status: DockerAgentStatus;
    lastSeenAt: Date | null;
    version: string | null;
    hostname: string | null;
    platform: string | null;
    architecture: string | null;
    dockerVersion: string | null;
    createdAt: Date;
}

export interface DockerAgentWithToken {
    agent: DockerAgentInfo;
    token: string;
}
