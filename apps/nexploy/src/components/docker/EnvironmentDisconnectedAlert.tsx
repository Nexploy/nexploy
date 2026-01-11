'use client';

import { useDockerStore } from '@/stores/docker/useDockerStore';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { AlertCircle } from 'lucide-react';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';

export function EnvironmentDisconnectedAlert() {
    const environmentStatus = useDockerStore((state) => state.environmentStatus);
    const getSelectedEnvironment = useEnvironmentStore((state) => state.getSelectedEnvironment);
    const selectedEnv = getSelectedEnvironment();
    const t = useTranslations('docker.environmentDisconnected');

    if (environmentStatus !== 'disconnected') {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('title')}</AlertTitle>
            <AlertDescription>
                {t.rich('description', {
                    name: selectedEnv?.name || 'Unknown',
                    strong: (chunks) => <strong>{chunks}</strong>,
                })}
                <br />
                <br />
                {t('checkTitle')}
                <ul className="mt-2 list-inside list-disc">
                    <li>{t('checkDaemon')}</li>
                    <li>{t('checkApi')}</li>
                    <li>{t('checkSwitch')}</li>
                </ul>
            </AlertDescription>
        </Alert>
    );
}
