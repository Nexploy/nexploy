import { FileCode2, Layers, type LucideIcon } from 'lucide-react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT, ICON_NAME_MAP } from '@nexploy/nodes/ui/theme';
import { ALL_NODE_DESCRIPTORS } from '@nexploy/nodes/registry/descriptors';

export * from '@nexploy/nodes/ui/theme';

export const NODE_BG_MUTED: Record<string, string> = Object.fromEntries(
    ALL_NODE_DESCRIPTORS.map((descriptor) => [descriptor.type, CATEGORY_BG_MUTED[descriptor.category]!]),
);

export const NODE_TEXT: Record<string, string> = Object.fromEntries(
    ALL_NODE_DESCRIPTORS.map((descriptor) => [descriptor.type, CATEGORY_TEXT[descriptor.category]!]),
);

export const NODE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
    ALL_NODE_DESCRIPTORS.map((descriptor) => [descriptor.type, ICON_NAME_MAP[descriptor.icon]]),
);

export const CATEGORY_ORDER = [
    'source',
    'build',
    'deploy',
    'script',
    'database',
    'config',
    'files',
    'flow',
    'integration',
    'utility',
] as const;

export const compareCategories = (a: string, b: string) => {
    const indexA = CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]);
    const indexB = CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]);
    return (indexA === -1 ? CATEGORY_ORDER.length : indexA) - (indexB === -1 ? CATEGORY_ORDER.length : indexB);
};

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
    dockerfile: FileCode2,
    compose: Layers,
};
