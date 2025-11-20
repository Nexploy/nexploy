'use client';

import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { TwoFactorDisableForm } from '@/components/account/2fa/forms/TwoFactorDIsableForm';

export function TwoFactorAuthSetting() {
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const handleDisable2FA = () => {
        closeDialog();
        openDialog({
            title: 'Disable Two-Factor Authentication',
            description:
                'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
            closeOnBackground: false,
            content: <TwoFactorDisableForm />,
            onSuccess: () => {
                closeDialog();
            },
        });
    };

    return (
        <DialogFooter className="justify-betwee flex w-full flex-row pt-4">
            <Button variant="destructive" onClick={handleDisable2FA}>
                Disable Two-Factor Auth
            </Button>
        </DialogFooter>
    );
}
