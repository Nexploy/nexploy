'use client';

import { useState } from 'react';
import { Play, UserPlus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { InitSwarmForm } from './InitSwarmDialog';
import { JoinSwarmForm } from './JoinSwarmDialog';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import { Can } from '@/components/permission/Can';

export function SwarmNotActive() {
    const [isPending, setIsPending] = useState(false);
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('swarm');

    const handleSuccess = () => {
        closeDialog();
        setIsPending(true);
    };

    const handleInitSwarm = () => {
        openDialog({
            title: t('initializeSwarmTitle'),
            description: t('initializeSwarmDescription'),
            content: <InitSwarmForm />,
            onSuccess: handleSuccess,
        });
    };

    const handleJoinSwarm = () => {
        openDialog({
            title: t('joinSwarmTitle'),
            description: t('joinSwarmDescription'),
            content: <JoinSwarmForm />,
            onSuccess: handleSuccess,
        });
    };

    if (isPending) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 pb-32">
                <h2 className="font-semibold text-2xl">{t('connectingToSwarm')}</h2>
                <p className="text-muted-foreground">{t('pleaseWaitSwarmLoading')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 pb-32 text-center">
            <h2 className="mb-2 font-semibold text-2xl">{t('notInSwarmModeTitle')}</h2>
            <p className="mb-8 max-w-md text-muted-foreground">{t('notInSwarmModeDescription')}</p>
            <Can
                resource="swarm"
                action="manage"
                fallback={<p className="max-w-md text-muted-foreground text-sm">{t('activationRequiresAdmin')}</p>}
            >
                <div className="flex justify-center gap-4">
                    <Button onClick={handleInitSwarm}>
                        <Play />
                        {t('initializeSwarm')}
                    </Button>
                    <Button variant="outline" onClick={handleJoinSwarm}>
                        <UserPlus />
                        {t('joinSwarm')}
                    </Button>
                </div>
            </Can>
        </div>
    );
}
