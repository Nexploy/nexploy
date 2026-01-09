'use client';

import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { TwoFactorDisableForm } from '@/components/account/2fa/forms/TwoFactorDIsableForm';
import { useTranslations } from 'next-intl';

export function TwoFactorAuthSetting() {
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('account.twoFactor');

    const handleDisable2FA = () => {
        closeDialog();
        openDialog({
            title: t('disableTitle'),
            description: t('disableDescription'),
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
                {t('disableButton')}
            </Button>
        </DialogFooter>
    );
}
