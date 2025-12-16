import CreateContainer from '@/components/docker/containers/CreateContainer';
import { Image } from '@workspace/typescript-interface/docker/docker.image';
import { kyDocker } from '@/lib/api/kyDocker';
import { InputAutoCompleteOption } from '@workspace/ui/components/search-command';

export default async function CreateContainerPage() {
    const listImages = await kyDocker.get('images').json<Image[]>();

    const filterListImages = listImages
        .filter((img) => img.repoTags && img.repoTags[0])
        .map((listImage) => ({
            value: listImage.repoTags[0],
            label: listImage.repoTags[0],
        })) as InputAutoCompleteOption[];

    return <CreateContainer listImages={filterListImages} />;
}
