'use client';

import { Button } from '@workspace/ui/components/button';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { LetsEncryptCertForm } from '@/components/repositories/tabs/domains/LetsEncryptCertForm';
import { CustomCertForm } from '@/components/repositories/tabs/domains/CustomCertForm';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function AddSSLButton() {
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const tSsl = useTranslations('repository.settings.ssl');
    const router = useRouter();

    function openLetsEncrypt() {
        openDialog({
            title: tSsl('addLetsEncrypt'),
            content: (
                <LetsEncryptCertForm
                    onClose={() => {
                        closeDialog();
                        router.refresh();
                    }}
                />
            ),
        });
    }

    function openCustom() {
        openDialog({
            title: tSsl('addCustom'),
            content: (
                <CustomCertForm
                    onClose={() => {
                        closeDialog();
                        router.refresh();
                    }}
                />
            ),
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="mt-5">
                    {tSsl('add')}
                    <ChevronDown className="size-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openLetsEncrypt}>
                    <ShieldCheck className="size-4" />
                    {tSsl('letsEncrypt')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openCustom}>
                    <ShieldCheck className="size-4" />
                    {tSsl('custom')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
