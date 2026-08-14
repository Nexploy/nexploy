'use client';

import type { LucideIcon } from 'lucide-react';
import { Box, Container, EthernetPort, HardDrive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import {
    isNexployInfrastructureContainer,
    isNexployInfrastructureImage,
    isNexployInfrastructureNetwork,
    isNexployInfrastructureVolumeName,
} from '@nexploy/shared/nexployFilter';

const resourceIconVariants = cva('flex shrink-0 items-center justify-center', {
    variants: {
        size: {
            sm: 'size-6 rounded-md',
            md: 'size-9 rounded-lg',
            lg: 'size-12 rounded-lg',
        },
        system: {
            true: 'bg-destructive/10',
            false: 'bg-primary/10',
        },
    },
    defaultVariants: { size: 'md', system: false },
});

const glyphVariants = cva('', {
    variants: {
        size: { sm: 'size-3.5', md: 'size-5', lg: 'size-7' },
        system: { true: 'text-destructive', false: 'text-primary' },
    },
    defaultVariants: { size: 'md', system: false },
});

type ResourceSize = NonNullable<VariantProps<typeof resourceIconVariants>['size']>;

type ResourceTarget =
    | { kind: 'container'; name: string | undefined }
    | { kind: 'image'; repoTags: string[] | undefined }
    | { kind: 'network'; name: string | undefined }
    | { kind: 'volume'; name: string | undefined };

type ResourceIconProps = ResourceTarget & {
    size?: ResourceSize;
    icon?: LucideIcon;
    className?: string;
};

const defaultIcons: Record<ResourceTarget['kind'], LucideIcon> = {
    container: Container,
    image: Box,
    network: EthernetPort,
    volume: HardDrive,
};

export function isSystemResource(target: ResourceTarget): boolean {
    switch (target.kind) {
        case 'container':
            return isNexployInfrastructureContainer({ name: target.name ?? '' });
        case 'image':
            return isNexployInfrastructureImage({ repoTags: target.repoTags });
        case 'network':
            return isNexployInfrastructureNetwork({ name: target.name ?? '' });
        case 'volume':
            return isNexployInfrastructureVolumeName(target.name ?? '');
    }
}

export function ResourceIcon({ size = 'md', icon, className, ...target }: ResourceIconProps) {
    const t = useTranslations('docker');

    const system = isSystemResource(target);
    const Glyph = icon ?? defaultIcons[target.kind];

    const badge = (
        <div className={cn(resourceIconVariants({ size, system }), className)}>
            <Glyph className={glyphVariants({ size, system })} />
        </div>
    );

    if (!system) return badge;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent className="max-w-xs">{t('system.tooltip')}</TooltipContent>
        </Tooltip>
    );
}
