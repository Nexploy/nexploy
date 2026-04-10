import { getRegistries } from '@/services/registry.service';
import { PullImageClient } from '@/components/docker/image/pull/PullImageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pull Image',
};

export default async function AddImagePage() {
    const registries = await getRegistries();

    return <PullImageClient registries={registries} />;
}
