export type DockerToastCategory = 'containers' | 'images' | 'volumes' | 'networks' | 'swarm';

export interface NotificationState {
    categories: Record<DockerToastCategory, boolean>;
    setCategoryEnabled: (category: DockerToastCategory, enabled: boolean) => void;
    isCategoryEnabled: (category: DockerToastCategory) => boolean;
}
