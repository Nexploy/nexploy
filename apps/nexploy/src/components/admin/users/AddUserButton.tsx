'use client';

import { Button } from '@workspace/ui/components/button';
import { UserPlus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateUserForm } from '@/components/admin/forms/CreateUserForm';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function AddUserButton() {
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('admin');

    const handleAddUser = async () => {
        openDialog({
            title: t('addUser'),
            description: t('addUserDescription'),
            content: <CreateUserForm />,
            onSuccess: () => {
                toast.success(t('userAddedSuccess'));
                closeDialog();
            },
        });
    };

    return (
        <Button onClick={handleAddUser}>
            <UserPlus />
            {t('addUser')}
        </Button>
    );
}
