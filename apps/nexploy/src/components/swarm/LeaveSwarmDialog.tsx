'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { onSwarmLeaveAction } from '@/actions/docker/swarm/leave.action';
import { useTranslations } from 'next-intl';

interface LeaveSwarmDialogProps {
    trigger?: React.ReactNode;
    isManager?: boolean;
}

export function LeaveSwarmDialog({ trigger, isManager }: LeaveSwarmDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [force, setForce] = useState(false);
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const handleLeave = async () => {
        setIsLoading(true);
        try {
            await onSwarmLeaveAction({ force });
            toast.success(t('leftSwarmSuccess'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger || (
                    <Button variant="destructive" size="sm">
                        <LogOut className="mr-2 size-4" />
                        {t('leaveSwarm')}
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('leaveSwarmConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('leaveSwarmConfirmDescription')}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex items-center space-x-2 py-4">
                    <Checkbox
                        id="force"
                        checked={force}
                        onCheckedChange={(checked) => setForce(checked === true)}
                    />
                    <Label htmlFor="force" className="text-sm">
                        {t('forceLeave')}
                    </Label>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleLeave}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? t('leaving') : t('leaveSwarm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
