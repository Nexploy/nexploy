import type { DockerHubImage } from '@workspace/typescript-interface/docker/docker.hub';
import { useState } from 'react';
import Image from 'next/image';
import { Box } from 'lucide-react';

interface ImageLogoProps {
    image: DockerHubImage;
}

export function ImageLogo({ image }: ImageLogoProps) {
    const [errored, setErrored] = useState(false);

    if (image.logoUrl && !errored) {
        return (
            <Image
                src={image.logoUrl}
                alt={image.name}
                width={32}
                height={32}
                className="size-10 shrink-0 rounded-md object-contain"
                onError={() => setErrored(true)}
            />
        );
    }

    return (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Box className="size-5 text-primary" />
        </div>
    );
}
