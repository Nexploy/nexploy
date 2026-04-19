import { getRegistries } from '@/services/registry.service';
import { PullImage } from '@/components/docker/image/pull/PullImage.tsx';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pull Image',
};

export default async function AddImagePage() {
    const registries = await getRegistries();

    return <PullImage registries={registries} />;
}
