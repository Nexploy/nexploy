import { create } from 'zustand';
import { ReactElement } from 'react';
import { AlertDialogContentProps } from '@radix-ui/react-alert-dialog';

export interface AlertConfirmationDialogState {
    isOpen: boolean;
    title?: ReactElement | string;
    props?: AlertDialogContentProps;
    description?: ReactElement | string;
    cancelLabel?: string | null;
    actionLabel?: string | null;
    isPending: boolean;
    disableCancelButton?: boolean;
    disableActionButton?: boolean;
    onAction?: (args?: any) => Promise<any>;
    onCancel?: () => Promise<any>;
}

export interface AlertConfirmationDialogActions {
    openAlertDialog: (data: Omit<AlertConfirmationDialogState, 'isOpen' | 'isPending'>) => void;
    closeAlertDialog: () => void;
}

export type AlertConfirmationDialogStore = AlertConfirmationDialogState &
    AlertConfirmationDialogActions;

const defaultAlertState: AlertConfirmationDialogState = {
    isOpen: false,
    title: undefined,
    description: undefined,
    props: undefined,
    cancelLabel: null,
    actionLabel: null,
    disableCancelButton: false,
    disableActionButton: false,
    isPending: false,
    onAction: async () => {},
    onCancel: undefined,
};

export const useAlertConfirmationDialogStore = create<AlertConfirmationDialogStore>((set) => ({
    ...defaultAlertState,
    openAlertDialog: (data) =>
        set({
            ...defaultAlertState,
            isOpen: true,
            ...data,
        }),
    closeAlertDialog: () => set({ isOpen: false }),
}));
