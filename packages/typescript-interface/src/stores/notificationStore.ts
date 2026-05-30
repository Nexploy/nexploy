export interface NotificationState {
    showContainerToast: boolean;
    setShowContainerToast: (enabled: boolean) => void;
    showImageToast: boolean;
    setShowImageToast: (enabled: boolean) => void;
    showVolumeToast: boolean;
    setShowVolumeToast: (enabled: boolean) => void;
    showBuildToast: boolean;
    setShowBuildToast: (enabled: boolean) => void;
}
