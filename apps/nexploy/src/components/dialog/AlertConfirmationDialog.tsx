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
import { isValidElement } from 'react';
import { useTranslations } from 'next-intl';

export function AlertConfirmationDialog() {
    const tCommon = useTranslations('common');
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

    const resolvedCancelLabel = cancelLabel ?? tCommon('cancel');
    const resolvedActionLabel = actionLabel ?? tCommon('confirm');

    const runCancel = () => {
        if (!onCancel) {
            closeAlertDialog();
            return;
        }

        useAlertConfirmationDialogStore.setState({ isPending: true });
        onCancel()
            .catch(() => {})
            .then(closeAlertDialog)
            .finally(() => useAlertConfirmationDialogStore.setState({ isPending: false }));
    };

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (open) return;

                runCancel();
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader className={'break-all'}>
                    <AlertDialogTitle asChild={isValidElement(title)}>{title}</AlertDialogTitle>
                    <AlertDialogDescription asChild={isValidElement(description)}>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {!disableCancelButton && (
                        <Button variant={'outline'} disabled={isPending} onClick={runCancel}>
                            {resolvedCancelLabel}
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
                                        .catch(() => {})
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
                            {resolvedActionLabel}
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
