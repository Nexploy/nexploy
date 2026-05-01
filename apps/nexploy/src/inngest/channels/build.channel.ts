import { channel, topic } from '@inngest/realtime';
import { BuildLogEntry } from '@workspace/typescript-interface/repository/build';
import { CommitInfo } from '@/types/pipeline.type';

export const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('build-status').type<{ buildStatus: string }>())
        .addTopic(topic('node-status').type<{ nodeId: string; nodeStatus: string }>())
        .addTopic(topic('commit-info').type<CommitInfo>());
    return channelDef();
};
