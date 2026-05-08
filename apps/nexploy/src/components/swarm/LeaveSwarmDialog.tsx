'use client';

import { useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { onSwarmLeaveAction } from '@/actions/docker/swarm/leave.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import { Field } from '@workspace/ui/components/field.tsx';

export function LeaveSwarmDialog() {
    const forceRef = useRef(false);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const handleOpen = () => {
        forceRef.current = false;
        openAlertDialog({
            title: t('leaveSwarmConfirmTitle'),
            description: (
                <div className="space-y-4">
                    <p>{t('leaveSwarmConfirmDescription')}</p>
                    <div className="flex cursor-pointer items-center space-x-2">
                        <Field orientation="horizontal">
                            <Checkbox
                                id="force-leave"
                                className={'cursor-pointer'}
                                defaultChecked={false}
                                onCheckedChange={(checked) => (forceRef.current = checked === true)}
                            />
                            <Label htmlFor="force-leave" className={'cursor-pointer'}>
                                {t('forceLeave')}
                            </Label>
                        </Field>
                    </div>
                </div>
            ),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('leaveSwarm'),
            onAction: async () => {
                await onSwarmLeaveAction({ force: forceRef.current });
                toast.success(t('leftSwarmSuccess'));
            },
        });
    };

    return (
        <Button
            className={'mt-5 size-8'}
            size={'icon'}
            icon={LogOut}
            variant="destructiveOutline"
            onClick={handleOpen}
        />
    );
}
