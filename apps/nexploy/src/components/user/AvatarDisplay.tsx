import { createAvatar } from '@dicebear/core';
import { glass } from '@dicebear/collection';
import { ImgHTMLAttributes } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import Image from 'next/image';

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
    seed: string;
}

export function AvatarDisplay({ seed, className, ...props }: AvatarProps) {
    const avatar = createAvatar(glass, {
        seed,
        size: 12,
    }).toDataUri();

    return (
        <Image
            {...props}
            className={cn('size-7 cursor-pointer rounded-lg select-none', className)}
            src={avatar}
            width={28}
            height={28}
            alt="Account Image"
        />
    );
}
