'use client';

import { useTranslations } from 'next-intl';
import { DockerToastCategory } from '@workspace/typescript-interface/stores/notificationStore';
import { NotificationSwitch } from '@/components/account/NotificationSwitch';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { notificationBadgeCategories, notificationBadgeTargets } from '@/lib/notifications/notificationBadges';

const categories: {
    key: DockerToastCategory;
    labelKey: string;
    descriptionKey: string;
}[] = [
    {
        key: 'containers',
        labelKey: 'alerts.containerAlerts',
        descriptionKey: 'alerts.containerStatusChanges',
    },
    { key: 'images', labelKey: 'alerts.imageAlerts', descriptionKey: 'alerts.imageStatusChanges' },
    {
        key: 'volumes',
        labelKey: 'alerts.volumeAlerts',
        descriptionKey: 'alerts.volumeStatusChanges',
    },
    {
        key: 'networks',
        labelKey: 'alerts.networkAlerts',
        descriptionKey: 'alerts.networkStatusChanges',
    },
    { key: 'swarm', labelKey: 'alerts.swarmAlerts', descriptionKey: 'alerts.swarmStatusChanges' },
];

export function NotificationPreferences() {
    const t = useTranslations('account');
    const { categories: enabled, setCategoryEnabled } = useNotificationStore();
    const badges = useNotificationStore((s) => s.badges);
    const setBadgeEnabled = useNotificationStore((s) => s.setBadgeEnabled);

    return (
        <div className={'space-y-6'}>
            <div className={'space-y-2'}>
                {categories.map((category) => (
                    <NotificationSwitch
                        key={category.key}
                        label={t(category.labelKey)}
                        description={t(category.descriptionKey)}
                        checked={enabled[category.key]}
                        onCheckedChange={(value) => setCategoryEnabled(category.key, value)}
                    />
                ))}
            </div>

            <div className={'space-y-2'}>
                <div className={'flex flex-col'}>
                    <span className={'text-base font-medium'}>{t('notifications.badges.title')}</span>
                    <span className={'text-muted-foreground text-sm'}>{t('notifications.badges.description')}</span>
                </div>
                {notificationBadgeCategories.map((category) => (
                    <NotificationSwitch
                        key={category}
                        label={t(notificationBadgeTargets[category].labelKey)}
                        description={t(notificationBadgeTargets[category].descriptionKey)}
                        checked={badges[category]}
                        onCheckedChange={(value) => setBadgeEnabled(category, value)}
                    />
                ))}
            </div>
        </div>
    );
}
