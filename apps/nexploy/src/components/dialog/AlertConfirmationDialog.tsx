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

    return (
        <AlertDialog open={isOpen} onOpenChange={closeAlertDialog}>
            <AlertDialogContent>
                <AlertDialogHeader className={'break-all'}>
                    <AlertDialogTitle asChild={isValidElement(title)}>{title}</AlertDialogTitle>
                    <AlertDialogDescription asChild={isValidElement(description)}>
                        {description}
                    </AlertDialogDescription>
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
