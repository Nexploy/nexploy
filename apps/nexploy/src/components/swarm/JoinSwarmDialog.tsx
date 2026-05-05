'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { toast } from 'sonner';
import { onSwarmJoinAction } from '@/actions/docker/swarm/join.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

export function JoinSwarmForm() {
    const { onSuccess, closeDialog } = useConfirmationDialogStore();
    const [isLoading, setIsLoading] = useState(false);
    const [joinToken, setJoinToken] = useState('');
    const [remoteAddrs, setRemoteAddrs] = useState('');
    const [advertiseAddr, setAdvertiseAddr] = useState('');
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const handleJoin = async () => {
        if (!joinToken) {
            toast.error(t('joinTokenRequired'));
            return;
        }
        if (!remoteAddrs) {
            toast.error(t('managerAddressRequired'));
            return;
        }

        const addrs = remoteAddrs
            .split('\n')
            .map((a) => a.trim())
            .filter((a) => a);

        if (addrs.length === 0) {
            toast.error(t('managerAddressRequired'));
            return;
        }

        setIsLoading(true);
        try {
            await onSwarmJoinAction({
                joinToken,
                remoteAddrs: addrs,
                advertiseAddr: advertiseAddr || undefined,
            });
            toast.success(t('joinedSwarmSuccess'));
            await onSwarmRefreshAction();
            if (onSuccess) onSuccess();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="joinToken">{t('joinToken')}</Label>
                <Input
                    id="joinToken"
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    placeholder={t('joinTokenPlaceholder')}
                    className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">{t('joinTokenDescription')}</p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="remoteAddrs">{t('managerAddresses')}</Label>
                <Textarea
                    id="remoteAddrs"
                    value={remoteAddrs}
                    onChange={(e) => setRemoteAddrs(e.target.value)}
                    placeholder="192.168.1.100:2377&#10;192.168.1.101:2377"
                    rows={3}
                    className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                    {t('managerAddressesDescription')}
                </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="advertiseAddr">
                    {t('advertiseAddress')}{' '}
                    <span className="text-muted-foreground text-xs">{t('optional')}</span>
                </Label>
                <Input
                    id="advertiseAddr"
                    value={advertiseAddr}
                    onChange={(e) => setAdvertiseAddr(e.target.value)}
                    placeholder={t('advertiseAddressPlaceholder')}
                />
                <p className="text-muted-foreground text-xs">
                    {t('advertiseAddressDescription')}
                </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
                    {tCommon('cancel')}
                </Button>
                <Button onClick={handleJoin} isLoading={isLoading} disabled={isLoading}>
                    {t('joinSwarm')}
                </Button>
            </div>
        </div>
    );
}
