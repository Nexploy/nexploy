import { create } from 'zustand';
import { ReactElement } from 'react';
import { DialogContentProps } from '@radix-ui/react-dialog';

export interface ConfirmationDialogState {
    isOpen: boolean;
    title?: ReactElement | string;
    props?: DialogContentProps;
    closeOnBackground?: boolean;
    description?: string | ReactElement;
    content?: any;
    onSuccess?: (args?: any) => void;
    onError?: () => void;
}

export interface ConfirmationDialogActions {
    openDialog: (
        data: Omit<ConfirmationDialogState, 'isOpen'> | null,
        keepPrevData?: boolean,
    ) => void;
    closeDialog: () => void;
}

export type ConfirmationDialogStore = ConfirmationDialogState & ConfirmationDialogActions;

const defaultState: ConfirmationDialogState = {
    isOpen: false,
    title: undefined,
    props: undefined,
    closeOnBackground: true,
    description: undefined,
    content: undefined,
    onSuccess: undefined,
    onError: undefined,
};

export const useConfirmationDialogStore = create<ConfirmationDialogStore>((set, get) => ({
    isOpen: false,
    closeOnBackground: true,
    openDialog: (data, keepPrevData) =>
        set(() => {
            const prevState = get();
            return {
                ...(keepPrevData ? prevState : defaultState),
                isOpen: true,
                ...data,
            };
        }),
    closeDialog: () => set({ isOpen: false }),
}));
