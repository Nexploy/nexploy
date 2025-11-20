'use client';

import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { TwoFactorEnabledForm } from '@/components/account/2fa/forms/TwoFactorEnabledForm';
import { Badge } from '@workspace/ui/components/badge';
import { TOTP } from '@workspace/typescript-interface/auth/twoFactorAuth';
import { TwoFactorAuthBackupCodes } from '@/components/account/2fa/TwoFactorAuthBackupCodes';
import { TwoFactorAuthSetting } from '@/components/account/2fa/TwoFactorAuthSetting';
import QRCode from 'react-qr-code';
import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Input } from '@workspace/ui/components/input';
import CopyButton from '@/components/utils/CopyButton';
import { TwoFactorVerifCodeForm } from '@/components/auth/2faVerifCodeForm';
import { DialogTitle } from '@workspace/ui/components/dialog';
import { Session } from '@/lib/auth/auth';

interface TwoFactorAuthProps {
    user?: Session['user'];
}

export function TwoFactorAuth({ user }: TwoFactorAuthProps) {
    const { openDialog } = useConfirmationDialogStore();

    const isTwoFactorEnabled = user?.twoFactorEnabled ?? false;

    const handleSetting2FA = () => {
        openDialog({
            title: 'Two-Factor Authentication Settings',
            description: 'Manage your two-factor authentication settings.',
            content: <TwoFactorAuthSetting />,
        });
    };

    const handleSetup2FA = async () => {
        openDialog({
            title: 'Enable 2FA',
            description: 'Secure your account by enabling two-factor authentication.',
            closeOnBackground: false,
            content: <TwoFactorEnabledForm />,
            onSuccess: ({ totpURI, backupCodes }: TOTP) =>
                openDialog({
                    title: 'Verif TOTP',
                    description:
                        'Scan the QR code with your authenticator app to complete two-factor authentication setup.',
                    closeOnBackground: false,
                    content: () => {
                        const secretKey = totpURI.split('secret=')[1]?.split('&')[0] || '';

                        return (
                            <div className={'space-y-6'}>
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                                        <QRCode value={totpURI} size={200} level="H" />
                                    </div>
                                    <p className="text-muted-foreground text-center text-xs">
                                        Can't scan? You can manually enter the secret key in your
                                        authenticator app
                                    </p>
                                    <ButtonGroup className={'flex w-full'}>
                                        <Input
                                            value={secretKey}
                                            readOnly
                                            onFocus={(e) => e.target.select()}
                                            className="flex-1 rounded-r-none font-mono text-sm"
                                        />
                                        <CopyButton
                                            textToCopy={secretKey}
                                            className="rounded-l-none border-l-0 !text-xs"
                                            size={'icon'}
                                            variant={'ghost'}
                                        />
                                    </ButtonGroup>
                                </div>
                                <div className={'flex flex-col gap-4'}>
                                    <DialogTitle className={'!text-base'}>
                                        Enter Verification Code :
                                    </DialogTitle>
                                    <TwoFactorVerifCodeForm
                                        onSuccess={() =>
                                            openDialog({
                                                title: 'Backup Codes',
                                                description:
                                                    'Keep these backup codes in a safe place. Each code can only be used once.',
                                                closeOnBackground: false,
                                                content: (
                                                    <TwoFactorAuthBackupCodes
                                                        backupCodes={backupCodes}
                                                    />
                                                ),
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        );
                    },
                }),
        });
    };

    return (
        <div className={'flex items-center justify-between rounded-md border p-3'}>
            <div className={'flex flex-col gap-1'}>
                <div className={'flex items-center gap-2'}>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <Badge variant={isTwoFactorEnabled ? 'default' : 'secondary'}>
                        {isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                    Add an extra layer of security to your account
                </p>
            </div>

            {isTwoFactorEnabled ? (
                <Button onClick={handleSetting2FA} size="sm">
                    Setting 2FA
                </Button>
            ) : (
                <Button onClick={handleSetup2FA} size="sm">
                    Enable 2FA
                </Button>
            )}
        </div>
    );
}
