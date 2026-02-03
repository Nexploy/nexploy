'use client';

import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import { useTranslations } from 'next-intl';

export function ChangePassword() {
    const { openDialog } = useConfirmationDialogStore();
    const tAccount = useTranslations('account');
    const tPassword = useTranslations('account.password');
    const tSecurity = useTranslations('account.securitySettings');

    const handleChangePassword = () => {
        openDialog({
            title: tPassword('title'),
            description: tPassword('description'),
            content: <ChangePasswordForm />,
        });
    };

    return (
        <div className="flex items-center justify-between rounded-md border p-3">
            <div>
                <p>{tAccount('securitySettings.password')}</p>
                <p className="text-muted-foreground text-xs">
                    {tAccount('securitySettings.passwordDescription')}
                </p>
            </div>
            <Button onClick={handleChangePassword} variant="outline" size="sm">
                {tSecurity('change')}
            </Button>
        </div>
    );
}
