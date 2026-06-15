import { create } from 'zustand';

interface SearchStore {
    open: boolean;
    inputValue: string;
    commandValue: string;

    openDialog: () => void;
    closeDialog: () => void;
    setInputValue: (value: string) => void;
    setCommandValue: (value: string) => void;

    runCommand: (fn: () => void) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
    open: false,
    inputValue: '',
    commandValue: '',

    openDialog: () => set({ open: true, inputValue: '' }),
    closeDialog: () => set({ open: false }),
    setInputValue: (inputValue) => set({ inputValue }),
    setCommandValue: (commandValue) => set({ commandValue }),
    runCommand: (fn) => {
        set({ open: false });
        fn();
    },
}));
