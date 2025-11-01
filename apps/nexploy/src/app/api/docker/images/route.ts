import { route } from '@/lib/api/nextRoute';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { NextResponse } from 'next/server';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { Image } from '@workspace/typescript-interface/docker/docker.image';

export const GET = route.handler(async () => {
    try {
        const listImages = await drinoDocker.get<Image[]>('/images').consume();

        const filterListImages = listImages
            .filter((img) => img.repoTags && img.repoTags[0])
            .map((listImage) => ({
                value: listImage.repoTags[0],
                label: listImage.repoTags[0],
            }));

        return NextResponse.json(filterListImages);
    } catch {
        await setToastServer({
            type: 'error',
            message: 'Error while fetching images',
        });
        return;
    }
});
