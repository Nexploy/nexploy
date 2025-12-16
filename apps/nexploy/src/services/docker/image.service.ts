import { kyDocker } from '@/lib/api/kyDocker';
import { Image } from '@workspace/typescript-interface/docker/docker.image';

export async function getAllImageByName(name: string): Promise<Pick<Image, 'name' | 'tag'>[]> {
    try {
        const images = await kyDocker
            .get(`images`, {
                searchParams: { name },
            })
            .json<Image[]>();

        return images.map(({ name, tag }) => ({ name, tag }));
    } catch {
        return [];
    }
}
