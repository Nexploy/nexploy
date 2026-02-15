import { create } from 'zustand';
import { ReactElement } from 'react';
import { AlertDialogContentProps } from '@radix-ui/react-alert-dialog';

export interface AlertConfirmationDialogState {
    isOpen: boolean;
    title?: string;
    asTitleDesc?: boolean;
    props?: AlertDialogContentProps;
    description?: ReactElement | string;
    asChildDesc?: boolean;
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
    asTitleDesc: false,
    description: undefined,
    asChildDesc: false,
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
