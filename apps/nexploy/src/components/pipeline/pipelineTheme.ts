import {
    ArrowUpDown,
    Bell,
    CircleX,
    Container,
    Database,
    Download,
    FileCheck,
    FileCode,
    FileCode2,
    FileKey,
    FileSearch,
    FlaskConical,
    FolderInput,
    FolderOutput,
    GitBranch,
    GitCommit,
    GitFork,
    Globe,
    Hammer,
    HardDrive,
    HeartPulse,
    KeyRound,
    Layers,
    type LucideIcon,
    Milestone,
    Network,
    Play,
    RefreshCw,
    Rocket,
    RotateCcw,
    ScrollText,
    Server,
    ShieldCheck,
    Square,
    SquareTerminal,
    Tag,
    Terminal,
    Timer,
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
    'start-container': 'deploy',
    'stop-container': 'deploy',
    'restart-container': 'deploy',
    'remove-container': 'deploy',
    'pull-image': 'build',
    'create-network': 'utility',
    'create-volume': 'utility',
    // Flow Control
    'wait-for-health': 'utility',
    'wait-for-url': 'utility',
    'wait-for-port': 'utility',
    'delay': 'utility',
    'condition': 'utility',
    // Script Execution
    'run-script': 'utility',
    'run-command-in-container': 'utility',
    'run-tests': 'utility',
    // HTTP / Webhooks
    'http-request': 'utility',
    'update-commit-status': 'utility',
    // Image Management
    'tag-image': 'build',
    'scan-image': 'build',
    'prune-images': 'build',
    // Files & Artifacts
    'template-file': 'utility',
    'upload-artifact': 'utility',
    'download-file': 'utility',
    // Database
    'run-migration': 'utility',
    'backup-database': 'utility',
    // Docker Swarm
    'deploy-stack': 'deploy',
    'update-service': 'deploy',
    'scale-service': 'deploy',
    // Monitoring
    'check-container-logs': 'utility',
    // Cache
    'cache-restore': 'utility',
    'cache-save': 'utility',
    // Git
    'git-tag': 'source',
    'git-clone-extra': 'source',
    // Secrets
    'fetch-secrets': 'utility',
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
    'start-container': Play,
    'stop-container': Square,
    'restart-container': RotateCcw,
    'remove-container': CircleX,
    'pull-image': Download,
    'create-network': Network,
    'create-volume': HardDrive,
    // Flow Control
    'wait-for-health': HeartPulse,
    'wait-for-url': Globe,
    'wait-for-port': Network,
    'delay': Timer,
    'condition': GitBranch,
    // Script Execution
    'run-script': Terminal,
    'run-command-in-container': SquareTerminal,
    'run-tests': FlaskConical,
    // HTTP / Webhooks
    'http-request': Webhook,
    'update-commit-status': GitCommit,
    // Image Management
    'tag-image': Tag,
    'scan-image': ShieldCheck,
    'prune-images': Trash2,
    // Files & Artifacts
    'template-file': FileCode,
    'upload-artifact': Upload,
    'download-file': Download,
    // Database
    'run-migration': Database,
    'backup-database': HardDrive,
    // Docker Swarm
    'deploy-stack': Layers,
    'update-service': RefreshCw,
    'scale-service': ArrowUpDown,
    // Monitoring
    'check-container-logs': ScrollText,
    // Cache
    'cache-restore': FolderInput,
    'cache-save': FolderOutput,
    // Git
    'git-tag': Milestone,
    'git-clone-extra': GitFork,
    // Secrets
    'fetch-secrets': KeyRound,
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
    Play,
    Square,
    RotateCcw,
    CircleX,
    Download,
    Network,
    HardDrive,
    // New icons
    HeartPulse,
    Globe,
    Timer,
    GitBranch,
    SquareTerminal,
    FlaskConical,
    GitCommit,
    ShieldCheck,
    FileCode,
    Database,
    RefreshCw,
    ArrowUpDown,
    ScrollText,
    FolderInput,
    FolderOutput,
    Milestone,
    GitFork,
    KeyRound,
};

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
    dockerfile: FileCode2,
    compose: Layers,
};
