'use client';

import { Button } from '@workspace/ui/components/button';
import { UserPlus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateUserForm } from '@/components/admin/forms/CreateUserForm';
import { toast } from 'sonner';

export function AddUserButton() {
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const handleAddUser = async () => {
        openDialog({
            title: 'Add User',
            description: 'The user has been added successfully.',
            content: <CreateUserForm />,
            onSuccess: () => {
                toast.success('User added successfully');
                closeDialog();
            },
        });
    };

    return (
        <Button onClick={handleAddUser}>
            <UserPlus />
            Add User
        </Button>
    );
}
