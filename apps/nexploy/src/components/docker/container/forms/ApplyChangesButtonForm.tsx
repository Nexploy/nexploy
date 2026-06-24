import { Button } from '@workspace/ui/components/button';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { onContainerRecreateAction } from '@/actions/docker/container/containerRecreate.action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';

export function ApplyChangesButtonForm() {
    const t = useTranslations('common');
    const {
        portChanges,
        envVarChanges,
        networkChanges,
        volumeChanges,
        hasChanges,
        resetAllChanges,
    } = useContainerChangesStore();
    const containerId = useContainerStore((state) => state.container?.id);
    const isSwarmContainer = useContainerStore(
        (state) => !!state.container?.labels?.['com.docker.swarm.service.id'],
    );
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleApplyChanges = async () => {
        if (!containerId) return;
        setIsLoading(true);

        const { data } = await onContainerRecreateAction({
            containerId,
            ports: portChanges,
            envVars: envVarChanges,
            volumes: volumeChanges,
            networks: networkChanges,
        });

        setIsLoading(false);
        resetAllChanges();

        if (data) {
            router.replace(`/docker/containers/${data.id}`);
        }
    };

    if (isSwarmContainer || !hasChanges()) return null;

    return (
        <Button
            icon={Save}
            isLoading={isLoading}
            onClick={handleApplyChanges}
            className={cn('mt-5')}
        >
            {t('applyChanges')}
        </Button>
    );
}
