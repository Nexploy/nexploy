import { inngest } from '@/inngest/client';
import { clearDiskAlert, getDiskGuardSettings, markDiskAlertRaised } from '@/services/diskGuardSettings.service';
import { getDiskGuardStatus } from '@/services/docker/diskGuard.service';
import { recordActivity } from '@/lib/activity/recordActivity';

export const diskSpaceMonitorFunction = inngest.createFunction(
    {
        id: 'disk-space-monitor',
        triggers: [{ cron: '*/10 * * * *' }],
    },
    async ({ step }) => {
        const settings = await step.run('load-disk-guard-settings', () => getDiskGuardSettings());

        if (!settings.enabled) return { skipped: true, reason: 'disabled' };

        const status = await step.run('read-disk-usage', () => getDiskGuardStatus());

        if (!status) return { skipped: true, reason: 'unavailable' };

        const level = status.level;

        if (level === 'ok') {
            if (settings.lastAlertLevel) {
                await step.run('clear-disk-alert', () => clearDiskAlert());
            }

            return { level, usedPercent: status.usedPercent };
        }

        if (settings.lastAlertLevel === level) {
            return { level, usedPercent: status.usedPercent, alreadyAlerted: true };
        }

        await step.run('record-disk-alert', async () => {
            await recordActivity({
                name: level === 'block' ? 'diskGuard.blocking' : 'diskGuard.warning',
                source: 'SYSTEM',
                status: level === 'block' ? 'FAILURE' : 'SUCCESS',
                input: {
                    path: status.path,
                    usedPercent: status.usedPercent,
                    freeBytes: status.freeBytes,
                    totalBytes: status.totalBytes,
                },
            });

            await markDiskAlertRaised(level);
        });

        return { level, usedPercent: status.usedPercent };
    },
);
