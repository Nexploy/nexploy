'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

export function ConfirmationDialog() {
    const { open, title, description, closeDialog, content, closeOnBackground, props } =
        useConfirmationDialogStore();

    return (
        <Dialog open={open} onOpenChange={closeDialog}>
            <DialogContent
                {...props}
                onPointerDownOutside={(e) => !closeOnBackground && e.preventDefault()}
            >
                {(title || description) && (
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                )}
                {content}
            </DialogContent>
        </Dialog>
    );
}
