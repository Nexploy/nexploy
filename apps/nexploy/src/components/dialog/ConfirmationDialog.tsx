'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { cn } from '@workspace/ui/lib/utils.ts';

export function ConfirmationDialog() {
    const { isOpen, title, description, closeDialog, content, closeOnBackground, props } =
        useConfirmationDialogStore();

    return (
        <Dialog open={isOpen} onOpenChange={closeDialog}>
            <DialogContent
                {...props}
                onPointerDownOutside={(e) => !closeOnBackground && e.preventDefault()}
                className={cn('overflow-hidden', props?.className)}
            >
                <div className="flex max-h-[90vh] flex-col gap-4">
                    {(title || description) && (
                        <DialogHeader>
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>{description}</DialogDescription>
                        </DialogHeader>
                    )}
                    <ScrollAreaWithShadow bottomShadow className="h-full">
                        <div className="px-6 pb-6">
                            {typeof content === 'function' ? content() : content}
                        </div>
                    </ScrollAreaWithShadow>
                </div>
            </DialogContent>
        </Dialog>
    );
}
