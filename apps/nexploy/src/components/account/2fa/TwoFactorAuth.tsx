'use client';

import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { TwoFactorEnabledForm } from '@/components/account/2fa/forms/TwoFactorEnabledForm';
import { TOTP } from '@workspace/typescript-interface/auth/twoFactorAuth';
import { TwoFactorAuthBackupCodes } from '@/components/account/2fa/TwoFactorAuthBackupCodes';
import { TwoFactorAuthSetting } from '@/components/account/2fa/TwoFactorAuthSetting';
import QRCode from 'react-qr-code';
import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Input } from '@workspace/ui/components/input';
import CopyButton from '@/components/shared/CopyButton';
import { TwoFactorVerifCodeForm } from '@/components/auth/2faVerifCodeForm';
import { DialogTitle } from '@workspace/ui/components/dialog';
import { Session } from '@/lib/auth/auth';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface TwoFactorAuthProps {
    user?: Session['user'];
}

export function TwoFactorAuth({ user }: TwoFactorAuthProps) {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('account.twoFactor');

    const isTwoFactorEnabled = user?.twoFactorEnabled ?? false;

    const handleSetting2FA = () => {
        openDialog({
            title: t('settingsTitle'),
            description: t('settingsDescription'),
            content: <TwoFactorAuthSetting />,
        });
    };

    const handleSetup2FA = async () => {
        openDialog({
            title: t('enableTitle'),
            description: t('enableDescription'),
            closeOnBackground: false,
            content: <TwoFactorEnabledForm />,
            onSuccess: ({ totpURI, backupCodes }: TOTP) =>
                openDialog({
                    title: t('verifTotp'),
                    description: t('verifTotpDescription'),
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
                                        {t('cantScan')}
                                    </p>
                                    <ButtonGroup className={'flex w-full'}>
                                        <Input
                                            value={secretKey}
                                            readOnly
                                            onFocus={(e) => e.target.select()}
                                            className="flex-1 rounded-r-none font-mono text-sm"
                                        />
                                        <CopyButton
                                            text={secretKey}
                                            className="rounded-l-none border-l-0 text-xs!"
                                            size={'icon'}
                                            variant={'ghost'}
                                        />
                                    </ButtonGroup>
                                </div>
                                <div className={'flex flex-col gap-4'}>
                                    <DialogTitle className={'text-base!'}>
                                        {t('enterVerificationCode')}
                                    </DialogTitle>
                                    <TwoFactorVerifCodeForm
                                        onSuccess={() =>
                                            openDialog({
                                                title: t('backupCodes'),
                                                description: t('backupCodesDescription'),
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
        <div className={'flex items-center justify-between gap-3 rounded-md border p-3'}>
            <div className={'flex flex-col'}>
                <span>{t('title')}</span>
                <span className="text-muted-foreground text-xs">{t('description')}</span>
            </div>

            {isTwoFactorEnabled ? (
                <Button onClick={handleSetting2FA} size="sm">
                    {t('settings')}
                </Button>
            ) : (
                <Button onClick={handleSetup2FA} size="sm">
                    {t('enable')}
                </Button>
            )}
        </div>
    );
}
