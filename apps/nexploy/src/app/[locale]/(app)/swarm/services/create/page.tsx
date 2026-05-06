import CreateService from '@/components/swarm/create/CreateService';
import { Image } from '@workspace/typescript-interface/docker/docker.image';
import { kyDocker } from '@/lib/api/kyDocker';
import { InputAutoCompleteOption } from '@workspace/ui/components/search-command';

export default async function CreateServicePage() {
    const listImages = await kyDocker.get('images').json<Image[]>();

    const filterListImages = listImages
        .filter((img) => img.repoTags && img.repoTags[0])
        .map((img) => ({
            value: img.repoTags[0],
            label: img.repoTags[0],
        })) as InputAutoCompleteOption[];

    return <CreateService listImages={filterListImages} />;
}
