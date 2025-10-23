import { create } from 'zustand';
import { ReactElement } from 'react';

export interface AlertConfirmationDialogState {
    open: boolean;
    title?: string
    description?: ReactElement | string
    cancelLabel?: string | null;
    actionLabel?: string | null;
    isPending: boolean;
    disableCancelButton?: boolean;
    disableActionButton?: boolean;
    onAction?: () => Promise<any> | void;
    onCancel?: () => Promise<any> | void;
}

export interface AlertConfirmationDialogActions {
    openAlertDialog: (data: Omit<AlertConfirmationDialogState, 'open' | 'isPending'>) => void;
    closeAlertDialog: () => void;
}

export type AlertConfirmationDialogStore = AlertConfirmationDialogState & AlertConfirmationDialogActions;

const defaultAlertState: AlertConfirmationDialogState = {
    open: false,
    title: undefined,
    description: undefined,
    cancelLabel: null,
    actionLabel: null,
    disableCancelButton: false,
    disableActionButton: false,
    isPending: false,
    onAction: async () => {
    },
    onCancel: undefined,
};

export const useAlertConfirmationDialogStore = create<AlertConfirmationDialogStore>((set) => ({
    ...defaultAlertState,
    openAlertDialog: (data) =>
        set({
            ...defaultAlertState,
            open: true,
            ...data,
        }),
    closeAlertDialog: () => set({ open: false }),
}));
