'use client';

import CopyButton from '@/components/shared/CopyButton';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface TwoFactorAuthBackupCodesProps {
    backupCodes: string[];
}

export function TwoFactorAuthBackupCodes({ backupCodes }: TwoFactorAuthBackupCodesProps) {
    const { closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('account.twoFactor');

    const downloadBackupCodes = () => {
        const data = backupCodes.join('\n');
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexploy-2AF-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={'flex flex-col gap-8'}>
            <div className="grid grid-cols-2 gap-3">
                {backupCodes.map((backupCode) => (
                    <div
                        key={backupCode}
                        className={`bg-muted flex items-center justify-between rounded-lg border p-2`}
                    >
                        <code className={`font-mono text-sm`}>{backupCode}</code>
                        <CopyButton
                            text={backupCode}
                            className="size-8 !text-xs"
                            size={'icon'}
                            variant={'ghost'}
                        />
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button variant={'outline'} onClick={closeDialog}>
                    {t('close')}
                </Button>
                <Button onClick={downloadBackupCodes}>{t('downloadCodes')}</Button>
            </DialogFooter>
        </div>
    );
}
