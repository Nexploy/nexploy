'use client';

import { ReactNode, useState } from 'react';
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
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { onInitSwarmAction } from '@/actions/docker/swarm/init.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { useTranslations } from 'next-intl';

interface InitSwarmDialogProps {
    trigger?: ReactNode;
    onInitSuccess?: () => void;
}

export function InitSwarmDialog({ trigger, onInitSuccess }: InitSwarmDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [advertiseAddr, setAdvertiseAddr] = useState('');
    const [listenAddr, setListenAddr] = useState('0.0.0.0:2377');
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const handleInit = async () => {
        if (!advertiseAddr) {
            toast.error(t('advertiseAddressRequired'));
            return;
        }

        setIsLoading(true);
        try {
            await onInitSwarmAction({
                listenAddr,
                advertiseAddr,
            });

            toast.success(t('swarmInitializedSuccess'));
            setOpen(false);
            resetForm();

            await onSwarmRefreshAction();
            onInitSuccess?.();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setAdvertiseAddr('');
        setListenAddr('0.0.0.0:2377');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Play className="mr-2 size-4" />
                        {t('initializeSwarm')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('initializeSwarmTitle')}</DialogTitle>
                    <DialogDescription>{t('initializeSwarmDescription')}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="advertiseAddr">{t('advertiseAddress')}</Label>
                        <Input
                            id="advertiseAddr"
                            value={advertiseAddr}
                            onChange={(e) => setAdvertiseAddr(e.target.value)}
                            placeholder={t('advertiseAddressPlaceholder')}
                        />
                        <p className="text-muted-foreground text-xs">
                            {t('advertiseAddressDescriptionInit')}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="listenAddr">{t('listenAddress')}</Label>
                        <Input
                            id="listenAddr"
                            value={listenAddr}
                            onChange={(e) => setListenAddr(e.target.value)}
                            placeholder={t('listenAddressPlaceholder')}
                        />
                        <p className="text-muted-foreground text-xs">
                            {t('listenAddressDescription')}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleInit} disabled={isLoading}>
                        {isLoading ? t('initializing') : t('initializeSwarm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
