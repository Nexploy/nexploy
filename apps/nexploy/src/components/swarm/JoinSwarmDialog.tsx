'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { onSwarmJoinAction } from '@/actions/docker/swarm/join.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { useTranslations } from 'next-intl';

interface JoinSwarmDialogProps {
    trigger?: React.ReactNode;
    onJoinSuccess?: () => void;
}

export function JoinSwarmDialog({ trigger, onJoinSuccess }: JoinSwarmDialogProps) {
    const [open, setOpen] = useState(false);
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
            setOpen(false);
            resetForm();

            await onSwarmRefreshAction();
            onJoinSuccess?.();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setJoinToken('');
        setRemoteAddrs('');
        setAdvertiseAddr('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <UserPlus className="mr-2 size-4" />
                        {t('joinSwarm')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('joinSwarmTitle')}</DialogTitle>
                    <DialogDescription>{t('joinSwarmDescription')}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
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
                            <span className="text-muted-foreground text-sm">{t('optional')}</span>
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleJoin} disabled={isLoading}>
                        {isLoading ? t('joining') : t('joinSwarm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
