import { inngest } from '@/inngest/client';
import { BuildConfig } from '@workspace/typescript-interface/repository/build';

export async function addBuildJob(buildId: string, config: BuildConfig): Promise<void> {
    await inngest.send({
        name: 'build/start',
        data: {
            buildId,
            config,
        },
    });
}
