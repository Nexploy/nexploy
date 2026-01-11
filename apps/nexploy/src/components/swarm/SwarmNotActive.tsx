'use client';

import { useState } from 'react';
import { Loader2, Network } from 'lucide-react';
import { InitSwarmDialog } from './InitSwarmDialog';
import { JoinSwarmDialog } from './JoinSwarmDialog';
import { useTranslations } from 'next-intl';

export function SwarmNotActive() {
    const [isPending, setIsPending] = useState(false);
    const t = useTranslations('swarm');

    const handleSuccess = () => {
        setIsPending(true);
    };

    if (isPending) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center">
                    <div className="bg-primary/10 mx-auto mb-6 flex size-20 items-center justify-center rounded-full">
                        <Loader2 className="text-primary size-10 animate-spin" />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold">{t('connectingToSwarm')}</h2>
                    <p className="text-muted-foreground max-w-md">
                        {t('pleaseWaitSwarmLoading')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
                <div className="bg-muted/50 mx-auto mb-6 flex size-20 items-center justify-center rounded-full">
                    <Network className="text-muted-foreground size-10" />
                </div>
                <h2 className="mb-2 text-2xl font-semibold">{t('notInSwarmModeTitle')}</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    {t('notInSwarmModeDescription')}
                </p>
                <div className="flex justify-center gap-4">
                    <InitSwarmDialog onInitSuccess={handleSuccess} />
                    <JoinSwarmDialog onJoinSuccess={handleSuccess} />
                </div>
            </div>
        </div>
    );
}
