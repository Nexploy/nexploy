'use client';

import { useTranslations } from 'next-intl';
import { NotificationSwitch } from '@/components/account/NotificationSwitch';
import { useNotificationStore } from '@/stores/useNotificationStore';

export function NotificationPreferences() {
    const t = useTranslations('account');
    const {
        showContainerToast,
        setShowContainerToast,
        showImageToast,
        setShowImageToast,
        showVolumeToast,
        setShowVolumeToast,
        showBuildToast,
        setShowBuildToast,
    } = useNotificationStore();

    return (
        <div className={'space-y-2'}>
            <NotificationSwitch
                label={t('alerts.containerAlerts')}
                description={t('alerts.containerStatusChanges')}
                checked={showContainerToast}
                onCheckedChange={setShowContainerToast}
            />
            <NotificationSwitch
                label={t('alerts.imageAlerts')}
                description={t('alerts.imageStatusChanges')}
                checked={showImageToast}
                onCheckedChange={setShowImageToast}
            />
            <NotificationSwitch
                label={t('alerts.volumeAlerts')}
                description={t('alerts.volumeStatusChanges')}
                checked={showVolumeToast}
                onCheckedChange={setShowVolumeToast}
            />
            <NotificationSwitch
                label={t('alerts.buildAlerts')}
                description={t('alerts.buildStatusChanges')}
                checked={showBuildToast}
                onCheckedChange={setShowBuildToast}
            />
        </div>
    );
}
