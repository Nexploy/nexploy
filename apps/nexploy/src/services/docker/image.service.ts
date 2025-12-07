import { drinoDocker } from '@/lib/api/drinoDocker';
import { Image } from '@workspace/typescript-interface/docker/docker.image';

export async function getAllImageByName(name: string): Promise<Pick<Image, 'name' | 'tag'>[]> {
    try {
        const images = await drinoDocker
            .get<Image[]>(`/images`, { queryParams: { name } })
            .consume();

        return images.map(({ name, tag }) => ({ name, tag }));
    } catch {
        return [];
    }
}
