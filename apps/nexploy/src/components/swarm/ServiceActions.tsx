'use client';

import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { MoreHorizontal, Scaling, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { onScaleServiceAction } from '@/actions/docker/swarm/scaleService.action';
import { onRemoveServiceAction } from '@/actions/docker/swarm/removeService.action';
import { useTranslations } from 'next-intl';

interface ServiceActionsProps {
    service: SwarmService;
}

export function ServiceActions({ service }: ServiceActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showScaleDialog, setShowScaleDialog] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [replicaCount, setReplicaCount] = useState(String(service.replicas));
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const handleScale = async () => {
        const replicas = parseInt(replicaCount, 10);
        if (isNaN(replicas) || replicas < 0) return;

        setIsLoading(true);
        try {
            await onScaleServiceAction({ id: service.id, replicas });
            toast.success(t('serviceScaledSuccess'));
            setShowScaleDialog(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            await onRemoveServiceAction({ id: service.id });
            toast.success(t('serviceRemovedSuccess', { name: service.name }));
            setShowRemoveDialog(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('serviceActions')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {service.mode === 'replicated' && (
                        <DropdownMenuItem
                            onClick={() => {
                                setReplicaCount(String(service.replicas));
                                setShowScaleDialog(true);
                            }}
                        >
                            <Scaling className="mr-2 size-4" />
                            {t('scaleService')}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowRemoveDialog(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 size-4" />
                        {t('removeService')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Scale Dialog */}
            <Dialog open={showScaleDialog} onOpenChange={setShowScaleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('scaleServiceTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('scaleServiceDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="replicas">{t('replicaCount')}</Label>
                            <Input
                                id="replicas"
                                type="number"
                                min={0}
                                value={replicaCount}
                                onChange={(e) => setReplicaCount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScaleDialog(false)}>
                            {tCommon('cancel')}
                        </Button>
                        <Button onClick={handleScale} disabled={isLoading}>
                            {isLoading ? t('scaling') : t('scaleService')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Confirm Dialog */}
            <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('removeServiceConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('removeServiceConfirmDescription', { name: service.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemove}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? t('removing') : t('removeService')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
