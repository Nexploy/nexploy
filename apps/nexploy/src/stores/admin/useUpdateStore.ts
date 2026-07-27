import ky from 'ky';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UpdateState, VersionInfo } from '@workspace/typescript-interface/stores/updateStore';

let inFlight: Promise<void> | null = null;

export const useUpdateStore = create<UpdateState>()(
    persist(
        (set, get) => ({
            version: null,
            isLoading: false,
            isChecking: false,
            isUpgrading: false,
            isRestarting: false,
            dismissedVersion: null,

            fetchVersion: async () => {
                if (inFlight) return inFlight;

                set({ isChecking: true, isLoading: get().version === null });

                inFlight = ky
                    .get('/api/admin/version')
                    .json<VersionInfo>()
                    .then((version) => {
                        set({ version });
                    })
                    .catch(() => {})
                    .finally(() => {
                        inFlight = null;
                        set({ isChecking: false, isLoading: false });
                    });

                return inFlight;
            },

            checkForUpdate: async () => {
                if (get().version || get().isChecking) return;
                await get().fetchVersion();
            },

            dismiss: () => set({ dismissedVersion: get().version?.latest ?? null }),

            setUpgrading: (isUpgrading) => set({ isUpgrading }),

            setRestarting: (isRestarting) => set({ isRestarting }),

            isUpdateAvailable: () => get().version?.updateAvailable === true,

            isBannerVisible: () => {
                const { version, dismissedVersion } = get();
                return version?.updateAvailable === true && version.latest !== dismissedVersion;
            },
        }),
        {
            name: 'nexploy-update',
            partialize: (state) => ({ dismissedVersion: state.dismissedVersion }),
        },
    ),
);
