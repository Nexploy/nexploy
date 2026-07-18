import { Settings } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { kyDocker } from '@/lib/api/kyDocker';
import { getCleanupSettings, getCurrentEnvironmentKey } from '@/services/cleanupSettings.service';
import { DiskUsageCard } from '@/components/admin/settings/DiskUsageCard';
import { CleanupScheduleCard } from '@/components/admin/settings/CleanupScheduleCard';
import { InstanceDomainCard } from '@/components/admin/settings/InstanceDomainCard';
import { getInstanceDomainSettings } from '@/lib/instance/domain';
import type { DiskUsage } from '@workspace/typescript-interface/docker/docker.system';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'System settings and Docker cleanup',
};

export default async function SettingsPage() {
    const environmentId = await getCurrentEnvironmentKey();
    const [t, settings] = await Promise.all([
        getTranslations('admin.settings'),
        getCleanupSettings(environmentId),
    ]);

    let diskUsage: DiskUsage | null = null;
    try {
        diskUsage = await kyDocker.get('system/df').json<DiskUsage>();
    } catch {
        diskUsage = null;
    }

    const instanceDomainSettings = getInstanceDomainSettings();

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex h-full flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Settings className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="break-all text-3xl font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="flex flex-col gap-5 pb-5">
                        <DiskUsageCard initialUsage={diskUsage} />
                        <CleanupScheduleCard settings={settings} />
                        {instanceDomainSettings && (
                            <InstanceDomainCard settings={instanceDomainSettings} />
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
