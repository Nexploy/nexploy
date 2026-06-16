import { inngest } from '@/inngest/client';
import {
    getCleanupSettings,
    LOCAL_ENVIRONMENT_KEY,
    markCleanupRan,
} from '@/services/cleanupSettings.service';
import { runScheduledCleanup } from '@/services/dockerCleanup.service';
import type { CleanupTarget } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';

export const CLEANUP_SCHEDULE_EVENT = 'docker/cleanup.schedule';

function computeNextRun(scheduledHour: number): Date {
    const now = new Date();
    const next = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), scheduledHour, 0, 0, 0),
    );
    if (next.getTime() <= now.getTime()) {
        next.setUTCDate(next.getUTCDate() + 1);
    }
    return next;
}

function collectTargets(settings: {
    cleanContainers: boolean;
    cleanImages: boolean;
    cleanVolumes: boolean;
    cleanBuild: boolean;
}): CleanupTarget[] {
    const targets: CleanupTarget[] = [];
    if (settings.cleanContainers) targets.push('containers');
    if (settings.cleanImages) targets.push('images');
    if (settings.cleanVolumes) targets.push('volumes');
    if (settings.cleanBuild) targets.push('build');
    return targets;
}

export const dockerCleanupSchedulerFunction = inngest.createFunction(
    {
        id: 'docker-cleanup-scheduler',
        singleton: { mode: 'cancel', key: 'event.data.environmentId' },
        triggers: [{ event: CLEANUP_SCHEDULE_EVENT }],
    },
    async ({ event, step }) => {
        const environmentId = (event.data?.environmentId as string) ?? LOCAL_ENVIRONMENT_KEY;

        const settings = await step.run('load-settings', async () =>
            getCleanupSettings(environmentId),
        );

        if (!settings.enabled) {
            return { skipped: true, reason: 'disabled', environmentId };
        }

        const nextRun = await step.run('compute-next-run', async () =>
            computeNextRun(settings.scheduledHour).toISOString(),
        );

        await step.sleepUntil('wait-for-scheduled-hour', nextRun);

        const current = await step.run('reload-settings', async () =>
            getCleanupSettings(environmentId),
        );

        if (!current.enabled) {
            return { skipped: true, reason: 'disabled', environmentId };
        }

        const targets = collectTargets(current);

        let reclaimed = 0;
        if (targets.length > 0) {
            reclaimed = await step.run('run-cleanup', async () =>
                runScheduledCleanup(targets, environmentId),
            );
            await step.run('mark-ran', async () => markCleanupRan(reclaimed, environmentId));
        }

        await step.sendEvent('reschedule', {
            name: CLEANUP_SCHEDULE_EVENT,
            data: { environmentId },
        });

        return { skipped: false, reclaimed, targets, environmentId };
    },
);
