'use client';

import Image from 'next/image';
import { Avatar, Style } from '@dicebear/core';
import glyphs from '@dicebear/styles/glyphs.json' with { type: 'json' };
import initials from '@dicebear/styles/initials.json' with { type: 'json' };
import glass from '@dicebear/styles/glass.json' with { type: 'json' };

import { cn } from '@workspace/ui/lib/utils';

interface DicebearAvatarProps {
    seed?: string;
    size?: number;
    className?: string;
    alt?: string;
    style?: 'glyphs' | 'initials' | 'glass';
}

const styleGlyphs = new Style(glyphs);
const styleInitials = new Style(initials);
const styleGlass = new Style(glass);

export function DicebearAvatar({ seed, size = 28, className, style = 'glyphs', alt = 'Avatar' }: DicebearAvatarProps) {
    const dataUri = new Avatar(style === 'glyphs' ? styleGlyphs : style === 'initials' ? styleInitials : styleGlass, {
        seed,
        size,
    }).toDataUri();

    return (
        <Image className={cn('size-fit rounded-md', className)} src={dataUri} width={size} height={size} alt={alt} />
    );
}
