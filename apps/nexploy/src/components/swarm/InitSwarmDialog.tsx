'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { onInitSwarmAction } from '@/actions/docker/swarm/init.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { detectPublicIpAction } from '@/actions/network/detectPublicIp.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface InitSwarmDialogProps {
    trigger?: ReactNode;
    onInitSuccess?: () => void;
}

function InitSwarmConfirmContent({
    advertiseAddr,
    onInitSuccess,
}: {
    advertiseAddr: string;
    onInitSuccess?: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onInitSwarmAction({
                advertiseAddr,
                listenAddr: '0.0.0.0:2377',
            });
            toast.success(t('swarmInitializedSuccess'));
            closeDialog();
            await onSwarmRefreshAction();
            onInitSuccess?.();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
                {tCommon('cancel')}
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? t('initializing') : t('initializeSwarm')}
            </Button>
        </div>
    );
}

export function InitSwarmDialog({ trigger, onInitSuccess }: InitSwarmDialogProps) {
    const [isDetecting, setIsDetecting] = useState(false);
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('swarm');

    const handleClick = async () => {
        setIsDetecting(true);
        let ip: string;

        try {
            const result = await detectPublicIpAction();
            if (!result?.data?.ip) {
                toast.error(t('failedToDetectIp'));
                return;
            }
            ip = result.data.ip;
        } catch {
            toast.error(t('failedToDetectIp'));
            return;
        } finally {
            setIsDetecting(false);
        }

        const advertiseAddr = `${ip}:2377`;

        openDialog({
            title: t('initializeSwarmTitle'),
            description: t('initializeSwarmConfirmDescription', { ip: advertiseAddr }),
            content: (
                <InitSwarmConfirmContent
                    advertiseAddr={advertiseAddr}
                    onInitSuccess={onInitSuccess}
                />
            ),
        });
    };

    return trigger ? (
        <div onClick={handleClick} className="cursor-pointer">
            {trigger}
        </div>
    ) : (
        <Button onClick={handleClick} disabled={isDetecting}>
            <Play className="mr-2 size-4" />
            {isDetecting ? t('detectingIp') : t('initializeSwarm')}
        </Button>
    );
}
