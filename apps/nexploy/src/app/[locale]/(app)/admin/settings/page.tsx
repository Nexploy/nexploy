import { Settings } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getCleanupSettings, getCurrentEnvironmentKey } from '@/services/cleanupSettings.service';
import { CleanupScheduleCard } from '@/components/admin/settings/CleanupScheduleCard';
import { InstanceDomainCard } from '@/components/admin/settings/InstanceDomainCard';
import { UpgradeCard } from '@/components/admin/settings/UpgradeCard';
import { ActivityRetentionCard } from '@/components/admin/settings/ActivityRetentionCard';
import { DockerEngineCard } from '@/components/admin/settings/DockerEngineCard';
import { DiskGuardCard } from '@/components/admin/settings/DiskGuardCard';
import { NetworkExposureCard } from '@/components/admin/settings/NetworkExposureCard';
import { getActivitySettings } from '@/services/activityLog.service';
import { getDiskGuardSettings } from '@/services/diskGuardSettings.service';
import { getNetworkExposureSettings } from '@/services/networkExposureSettings.service';
import { getInstanceDomainSettings } from '@/lib/instance/domain';
import { getInstanceCallbackTargets } from '@/lib/instance/oauthCallbacks';
import { OAuthCallbacksCard } from '@/components/admin/settings/OAuthCallbacksCard';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'System settings and Docker cleanup',
};

export default async function SettingsPage() {
    const environmentId = await getCurrentEnvironmentKey();
    const instanceDomainSettings = getInstanceDomainSettings();
    const showNetworkExposure = process.env.NODE_ENV === 'production';

    const [t, settings, activitySettings, diskGuardSettings, networkExposureSettings, callbackTargets] =
        await Promise.all([
            getTranslations('admin.settings'),
            getCleanupSettings(environmentId),
            getActivitySettings(),
            getDiskGuardSettings(),
            showNetworkExposure ? getNetworkExposureSettings() : Promise.resolve(null),
            instanceDomainSettings ? getInstanceCallbackTargets() : Promise.resolve(null),
        ]);

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex h-full flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Settings className="size-7 text-primary" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="flex flex-col gap-5 pb-5">
                        <UpgradeCard />
                        <DockerEngineCard />
                        <DiskGuardCard settings={diskGuardSettings} />
                        {networkExposureSettings && <NetworkExposureCard settings={networkExposureSettings} />}
                        <CleanupScheduleCard settings={settings} />
                        <ActivityRetentionCard settings={activitySettings} />
                        {instanceDomainSettings && <InstanceDomainCard settings={instanceDomainSettings} />}
                        {callbackTargets && <OAuthCallbacksCard targets={callbackTargets} />}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
