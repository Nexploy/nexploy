'use client';

import { Button } from '@workspace/ui/components/button';
import { UserPlus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateUserForm } from '@/components/admin/forms/CreateUserForm';
import { useTranslations } from 'next-intl';

export function AddUserButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('admin');

    const handleAddUser = async () => {
        openDialog({
            title: t('addUser'),
            description: t('addUserDescription'),
            content: <CreateUserForm />,
        });
    };

    return (
        <Button onClick={handleAddUser}>
            <UserPlus />
            {t('addUser')}
        </Button>
    );
}
