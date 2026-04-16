import dayjs from 'dayjs';
import { Image, ImageRow } from '@workspace/typescript-interface/docker/docker.image';
import { formatBytes } from '@/utils/formatBytes';

export function matchesSearch(image: ImageRow, search: string): boolean {
    const { name, tag, id, size, created } = image;
    const realSize = formatBytes(size);
    const date = dayjs.unix(created).format('DD/MM/YYYY');

    return (
        name?.some((n) => n.toLowerCase().includes(search)) ||
        tag?.some((t) => t.toLowerCase().includes(search)) ||
        id.toLowerCase().includes(search) ||
        date.toLowerCase().includes(search) ||
        realSize.toLowerCase().includes(search)
    );
}

export function groupImagesByRepository(images: Image[]): ImageRow[] {
    const grouped = new Map<string, Image[]>();

    images.forEach((image) => {
        const repoName = image.name?.[0] || '<none>';
        if (!grouped.has(repoName)) {
            grouped.set(repoName, []);
        }
        grouped.get(repoName)!.push(image);
    });

    const result: ImageRow[] = [];

    grouped.forEach((groupImages, repoName) => {
        if (groupImages.length === 1) {
            result.push(groupImages[0] as ImageRow);
        } else {
            const totalSize = groupImages.reduce((acc, img) => acc + img.size, 0);
            const latestCreated = Math.max(...groupImages.map((img) => img.created));
            const containersUsed = groupImages.reduce((acc, img) => acc + img.containersUsed, 0);

            result.push({
                id: `group-${repoName}`,
                fullId: `group-${repoName}`,
                name: [repoName],
                tag: groupImages.map((img) => img.tag?.[0] || '<none>'),
                repoTags: groupImages.flatMap((img) => img.repoTags),
                repoDigests: [],
                created: latestCreated,
                size: totalSize,
                virtualSize: totalSize,
                sharedSize: 0,
                labels: {},
                containersUsed,
                timestamp: Date.now(),
                isGroup: true,
                groupName: repoName,
                subRows: groupImages as ImageRow[],
            });
        }
    });

    return result.sort((a, b) => {
        const nameA = a.name?.[0]?.toLowerCase() || '';
        const nameB = b.name?.[0]?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
    });
}
