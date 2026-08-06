export function downloadImageArchive(imageIds: string[]): void {
    if (!imageIds.length) return;

    window.location.href = `/api/docker/images/save?imageIds=${encodeURIComponent(imageIds.join(','))}`;
}
