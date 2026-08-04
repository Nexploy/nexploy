export interface VersionInfo {
    current: string;
    latest: string;
    updateAvailable: boolean;
    releaseUrl: string | null;
    releasesUrl: string | null;
}

export interface ActiveBuildInfo {
    id: string;
    repositoryName: string;
    status: string;
}

export interface UpdateState {
    version: VersionInfo | null;
    isLoading: boolean;
    isChecking: boolean;
    isUpgrading: boolean;
    isRestarting: boolean;
    dismissedVersion: string | null;

    fetchVersion: () => Promise<void>;
    checkForUpdate: () => Promise<void>;
    dismiss: () => void;
    setUpgrading: (isUpgrading: boolean) => void;
    setRestarting: (isRestarting: boolean) => void;
    isUpdateAvailable: () => boolean;
    isBannerVisible: () => boolean;
}
