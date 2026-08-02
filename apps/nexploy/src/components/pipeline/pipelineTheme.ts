import { FileCode2, Layers, type LucideIcon } from 'lucide-react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT, ICON_NAME_MAP } from '@nexploy/node-ui/theme';
import { ALL_NODE_DESCRIPTORS } from '@nexploy/nodes/registry/descriptors';

export * from '@nexploy/node-ui/theme';

export const NODE_BG_MUTED: Record<string, string> = Object.fromEntries(
    ALL_NODE_DESCRIPTORS.map((descriptor) => [descriptor.type, CATEGORY_BG_MUTED[descriptor.category]!]),
);

export const NODE_TEXT: Record<string, string> = Object.fromEntries(
    ALL_NODE_DESCRIPTORS.map((descriptor) => [descriptor.type, CATEGORY_TEXT[descriptor.category]!]),
);

export const NODE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
    ALL_NODE_DESCRIPTORS.map((descriptor) => [descriptor.type, ICON_NAME_MAP[descriptor.icon]]),
);

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
    dockerfile: FileCode2,
    compose: Layers,
};
