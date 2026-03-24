import {
    Bell,
    Container,
    FileCheck,
    FileCode2,
    FileKey,
    FileSearch,
    GitBranch,
    Hammer,
    Layers,
    type LucideIcon,
    Rocket,
    Server,
    Tag,
    Terminal,
    Trash2,
    Upload,
    Variable,
    Webhook,
    Wrench,
} from 'lucide-react';

export const CATEGORY_BG_MUTED: Record<string, string> = {
    source: 'bg-blue-500/10',
    build: 'bg-orange-500/10',
    deploy: 'bg-green-500/10',
    utility: 'bg-yellow-500/10',
    notification: 'bg-pink-500/10',
};

export const CATEGORY_BG: Record<string, string> = {
    source: '!bg-blue-500',
    build: '!bg-orange-500',
    deploy: '!bg-green-500',
    utility: '!bg-yellow-500',
    notification: '!bg-pink-500',
};

export const CATEGORY_TEXT: Record<string, string> = {
    source: 'text-blue-600',
    build: 'text-orange-600',
    deploy: 'text-green-600',
    utility: 'text-yellow-600',
    notification: 'text-pink-600',
};

export const CATEGORY_HEX: Record<string, string> = {
    source: '#2b7fff',
    build: '#ff6900',
    deploy: '#00c951',
    utility: '#efb100',
    notification: '#f6339a',
};

export const CATEGORY_BORDER: Record<string, string> = {
    source: 'border-blue-500',
    build: 'border-orange-500',
    deploy: 'border-green-500',
    utility: 'border-yellow-500',
    notification: 'border-pink-500',
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    source: GitBranch,
    build: Hammer,
    deploy: Rocket,
    utility: Wrench,
    notification: Bell,
};

const NODE_CATEGORY: Record<string, string> = {
    'clone-repository': 'source',
    'webhook-clone': 'source',
    'validate-dockerfile': 'build',
    'validate-compose': 'build',
    'build-docker-image': 'build',
    'push-to-registry': 'build',
    'deploy-container': 'deploy',
    'deploy-compose': 'deploy',
    'write-env-file': 'utility',
    'set-env-vars': 'utility',
    'clean-workdir': 'utility',
    'send-notification': 'notification',
    'save-version': 'utility',
    'set-environment': 'deploy',
};

export const NODE_BG_MUTED: Record<string, string> = Object.fromEntries(
    Object.entries(NODE_CATEGORY).map(([node, cat]) => [node, CATEGORY_BG_MUTED[cat]!]),
);

export const NODE_TEXT: Record<string, string> = Object.fromEntries(
    Object.entries(NODE_CATEGORY).map(([node, cat]) => [node, CATEGORY_TEXT[cat]!]),
);

export const NODE_ICONS: Record<string, LucideIcon> = {
    'clone-repository': GitBranch,
    'webhook-clone': Webhook,
    'validate-dockerfile': FileCheck,
    'validate-compose': FileSearch,
    'build-docker-image': Container,
    'push-to-registry': Upload,
    'deploy-container': Rocket,
    'deploy-compose': Layers,
    'write-env-file': FileKey,
    'set-env-vars': Variable,
    'clean-workdir': Trash2,
    'send-notification': Bell,
    'save-version': Tag,
    'set-environment': Server,
};

export const ICON_NAME_MAP: Record<string, LucideIcon> = {
    GitClone: GitBranch,
    Webhook,
    Container,
    Rocket,
    Layers,
    Upload,
    FileKey,
    FileCheck,
    FileSearch,
    Variable,
    Trash2,
    Terminal,
    Bell,
    Tag,
    Server,
};

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
    dockerfile: FileCode2,
    compose: Layers,
};
