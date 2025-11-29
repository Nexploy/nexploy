import { inngest } from '@/inngest/client';
import { BuildConfig } from '@workspace/typescript-interface/inngest/build';

export async function addBuildJob(deploymentId: string, config: BuildConfig): Promise<void> {
    await inngest.send({
        name: 'build/start',
        data: {
            deploymentId,
            config,
        },
    });
}
