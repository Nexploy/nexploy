import { type NodeHostServices } from '@workspace/typescript-interface/pipeline/nodeServices';
import { kyDocker } from '@/lib/api/kyDocker';

export const hostServices: NodeHostServices = {
    docker: kyDocker,
};
