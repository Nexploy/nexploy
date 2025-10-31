import { create } from 'zustand';
import { ReactElement } from 'react';
import { DialogContentProps } from '@radix-ui/react-dialog';

export interface ConfirmationDialogState {
    open: boolean;
    title?: ReactElement | string;
    props?: DialogContentProps;
    closeOnBackground?: boolean;
    description?: string | ReactElement;
    content?: ReactElement | string;
    onSuccess?: (args: any) => void;
    onError?: () => void;
}

export interface ConfirmationDialogActions {
    openDialog: (
        data: Omit<ConfirmationDialogState, 'open'> | null,
        keepPrevData?: boolean,
    ) => void;
    closeDialog: () => void;
}

export type ConfirmationDialogStore = ConfirmationDialogState & ConfirmationDialogActions;

const defaultState: ConfirmationDialogState = {
    open: false,
    title: undefined,
    props: undefined,
    closeOnBackground: true,
    description: undefined,
    content: undefined,
    onSuccess: undefined,
    onError: undefined,
};

export const useConfirmationDialogStore = create<ConfirmationDialogStore>((set, get) => ({
    open: false,
    closeOnBackground: true,
    openDialog: (data, keepPrevData) =>
        set(() => {
            const prevState = get();
            return {
                ...(keepPrevData ? prevState : defaultState),
                open: true,
                ...data,
            };
        }),
    closeDialog: () => set({ open: false }),
}));
