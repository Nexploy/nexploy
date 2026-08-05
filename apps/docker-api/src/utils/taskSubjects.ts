import { containersStateManager } from '@/managers/list/containersStateManager';
import { imagesStateManager } from '@/managers/list/imagesStateManager';
import { networksStateManager } from '@/managers/list/networksStateManager';

const MAX_LISTED_NAMES = 3;

function shortId(value: string): string {
    const id = value.replace(/^sha256:/, '');

    return /^[0-9a-f]{12,}$/i.test(id) ? id.slice(0, 12) : value;
}

export function joinSubjects(names: string[]): string {
    if (names.length <= MAX_LISTED_NAMES) {
        return names.join(', ');
    }

    return `${names.slice(0, MAX_LISTED_NAMES).join(', ')} +${names.length - MAX_LISTED_NAMES}`;
}

export function describeContainers(containerIds: string[]): string {
    return joinSubjects(
        containerIds.map((id) => {
            try {
                return containersStateManager.getContainer(id)?.name.replace(/^\//, '') ?? shortId(id);
            } catch {
                return shortId(id);
            }
        }),
    );
}

export function describeImages(imageIds: string[]): string {
    return joinSubjects(
        imageIds.map((id) => {
            try {
                return imagesStateManager.getById(id)?.repoTags?.[0] ?? shortId(id);
            } catch {
                return shortId(id);
            }
        }),
    );
}

export function describeNetworks(networkIds: string[]): string {
    return joinSubjects(
        networkIds.map((id) => {
            try {
                return networksStateManager.getById(id)?.name ?? shortId(id);
            } catch {
                return shortId(id);
            }
        }),
    );
}
