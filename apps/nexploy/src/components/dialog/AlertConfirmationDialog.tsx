'use client';

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

export function AlertConfirmationDialog() {
    const {
        isOpen,
        title,
        description,
        cancelLabel,
        actionLabel,
        isPending,
        disableCancelButton,
        disableActionButton,
        onAction,
        onCancel,
        closeAlertDialog,
    } = useAlertConfirmationDialogStore();

    return (
        <AlertDialog open={isOpen} onOpenChange={closeAlertDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {!disableCancelButton && (
                        <Button
                            variant={'outline'}
                            disabled={isPending}
                            onClick={() => {
                                if (onCancel) {
                                    useAlertConfirmationDialogStore.setState({ isPending: true });
                                    onCancel()
                                        .then(closeAlertDialog)
                                        .finally(() =>
                                            useAlertConfirmationDialogStore.setState({
                                                isPending: false,
                                            }),
                                        );
                                } else {
                                    closeAlertDialog();
                                }
                            }}
                        >
                            {cancelLabel}
                        </Button>
                    )}
                    {!disableActionButton && (
                        <Button
                            variant={'destructive'}
                            isLoading={isPending}
                            disabled={isPending}
                            onClick={() => {
                                useAlertConfirmationDialogStore.setState({ isPending: true });
                                if (onAction) {
                                    onAction()
                                        .then(closeAlertDialog)
                                        .finally(() =>
                                            useAlertConfirmationDialogStore.setState({
                                                isPending: false,
                                            }),
                                        );
                                } else {
                                    closeAlertDialog();
                                }
                            }}
                        >
                            {actionLabel}
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
