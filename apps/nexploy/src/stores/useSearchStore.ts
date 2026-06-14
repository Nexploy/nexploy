import { create } from 'zustand';
import type { RepositoryResult } from '@/components/search/SearchPrimitives';

interface SearchStore {
    open: boolean;
    inputValue: string;
    commandValue: string;
    repositories: RepositoryResult[];
    reposFetched: boolean;

    openDialog: () => void;
    closeDialog: () => void;
    setInputValue: (value: string) => void;
    setCommandValue: (value: string) => void;

    runCommand: (fn: () => void) => void;
    setRepositories: (repos: RepositoryResult[]) => void;
    setReposFetched: (fetched: boolean) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
    open: false,
    inputValue: '',
    commandValue: '',
    repositories: [],
    reposFetched: false,

    openDialog: () => set({ open: true, inputValue: '' }),
    closeDialog: () => set({ open: false }),
    setInputValue: (inputValue) => set({ inputValue }),
    setCommandValue: (commandValue) => set({ commandValue }),
    runCommand: (fn) => {
        set({ open: false });
        fn();
    },
    setRepositories: (repositories) => set({ repositories }),
    setReposFetched: (reposFetched) => set({ reposFetched }),
}));
