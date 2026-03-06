import { create } from 'zustand';

interface NodePaletteStore {
    open: boolean;
    activeCategory: string | null;
    search: string;
    setOpen: (open: boolean) => void;
    setActiveCategory: (category: string | null) => void;
    setSearch: (search: string) => void;
    openCategory: (category: string) => void;
    close: () => void;
}

export const useNodePaletteStore = create<NodePaletteStore>((set) => ({
    open: true,
    activeCategory: null,
    search: '',
    setOpen: (open) => set({ open }),
    setActiveCategory: (activeCategory) => set({ activeCategory }),
    setSearch: (search) => set({ search }),
    openCategory: (category) => set({ activeCategory: category, search: '' }),
    close: () => set({ open: false, activeCategory: null, search: '' }),
}));
