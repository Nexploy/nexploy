import {
    ArrowUpDown,
    Bell,
    CircleX,
    CloudBackup,
    Container,
    Database,
    Download,
    FileCheck,
    FileCode,
    FileCode2,
    FileKey,
    FileSearch,
    FolderInput,
    FolderOpen,
    FolderOutput,
    GitBranch,
    GitCommit,
    GitFork,
    GitMerge,
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
    SlidersHorizontal,
    Square,
    SquareTerminal,
    Tag,
    Terminal,
    Timer,
    Trash2,
    Upload,
    Variable,
    Webhook,
    Workflow,
    PackagePlus,
    PackageCheck,
    ScanSearch,
    Wrench,
} from 'lucide-react';

export const CATEGORY_BG_MUTED: Record<string, string> = {
    source: 'bg-blue-500/10',
    build: 'bg-orange-500/10',
    deploy: 'bg-green-500/10',
    script: 'bg-purple-500/10',
    database: 'bg-teal-500/10',
    flow: 'bg-sky-500/10',
    config: 'bg-slate-500/10',
    files: 'bg-indigo-500/10',
    integration: 'bg-rose-500/10',
    utility: 'bg-yellow-500/10',
};

export const CATEGORY_BG: Record<string, string> = {
    source: '!bg-blue-500',
    build: '!bg-orange-500',
    deploy: '!bg-green-500',
    script: '!bg-purple-500',
    database: '!bg-teal-500',
    flow: '!bg-sky-500',
    config: '!bg-slate-500',
    files: '!bg-indigo-500',
    integration: '!bg-rose-500',
    utility: '!bg-yellow-500',
};

export const CATEGORY_TEXT: Record<string, string> = {
    source: 'text-blue-600',
    build: 'text-orange-600',
    deploy: 'text-green-600',
    script: 'text-purple-600',
    database: 'text-teal-600',
    flow: 'text-sky-600',
    config: 'text-slate-600',
    files: 'text-indigo-600',
    integration: 'text-rose-600',
    utility: 'text-yellow-600',
};

export const CATEGORY_HEX: Record<string, string> = {
    source: '#2b7fff',
    build: '#ff6900',
    deploy: '#00c951',
    script: '#a855f7',
    database: '#14b8a6',
    flow: '#0ea5e9',
    config: '#64748b',
    files: '#6366f1',
    integration: '#f43f5e',
    utility: '#efb100',
};

export const CATEGORY_BORDER: Record<string, string> = {
    source: 'border-blue-500',
    build: 'border-orange-500',
    deploy: 'border-green-500',
    script: 'border-purple-500',
    database: 'border-teal-500',
    flow: 'border-sky-500',
    config: 'border-slate-500',
    files: 'border-indigo-500',
    integration: 'border-rose-500',
    utility: 'border-yellow-500',
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    source: GitBranch,
    build: Hammer,
    deploy: Rocket,
    script: Terminal,
    database: Database,
    flow: Workflow,
    config: SlidersHorizontal,
    files: FolderOpen,
    integration: Webhook,
    utility: Wrench,
};

const NODE_CATEGORY: Record<string, string> = {
    'clone-repository': 'source',
    'webhook-clone': 'source',
    'validate-dockerfile': 'build',
    'validate-compose': 'build',
    'build-docker-image': 'build',
    'push-to-registry': 'build',
    'deploy-compose': 'deploy',
    'env-vars': 'config',
    'set-env-vars': 'config',
    'clean-workdir': 'utility',
    'send-notification': 'integration',
    'save-version': 'utility',
    'set-environment': 'deploy',
    'start-container': 'deploy',
    'stop-container': 'deploy',
    'restart-container': 'deploy',
    'remove-container': 'deploy',
    'delete-container': 'deploy',
    'create-container': 'deploy',
    'create-network': 'utility',
    'create-volume': 'utility',
    // Flow Control
    'wait-for-health': 'flow',
    'wait-for-url': 'flow',
    'wait-for-port': 'flow',
    delay: 'flow',
    condition: 'flow',
    // Script Execution
    'run-command-in-container': 'script',
    // HTTP / Webhooks
    'http-request': 'integration',
    'update-commit-status': 'integration',
    // Image Management
    'tag-image': 'build',
    'scan-image': 'build',
    'prune-images': 'build',
    'delete-image': 'build',
    'delete-network': 'utility',
    'delete-volume': 'utility',
    // Files & Artifacts
    'download-file': 'files',
    // Database
    'backup-volume-s3': 'database',
    // Docker Swarm
    'create-service': 'deploy',
    'update-service': 'deploy',
    'scale-service': 'deploy',
    // Monitoring
    'check-container-logs': 'utility',
    // Cache
    'cache-restore': 'files',
    'cache-save': 'files',
    // Git
    'git-tag': 'source',
    'git-clone-extra': 'source',
    // Secrets & Config
    'fetch-secrets-vault': 'config',
    'fetch-secrets-doppler': 'config',
    // Code Quality
    'sonarqube-scan': 'build',
    // Git CI/CD
    'create-release': 'integration',
    'cherry-pick-commit': 'source',
    'merge-branch': 'source',
    // Domain & SSL
    'add-domain': 'deploy',
    'add-ssl-certificate': 'deploy',
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
    'deploy-compose': Layers,
    'env-vars': FileKey,
    'set-env-vars': Variable,
    'clean-workdir': Trash2,
    'send-notification': Bell,
    'save-version': Tag,
    'set-environment': Server,
    'start-container': Play,
    'stop-container': Square,
    'restart-container': RotateCcw,
    'remove-container': CircleX,
    'delete-container': Trash2,
    'create-container': PackagePlus,
    'create-network': Network,
    'create-volume': HardDrive,
    // Flow Control
    'wait-for-health': HeartPulse,
    'wait-for-url': Globe,
    'wait-for-port': Network,
    delay: Timer,
    condition: GitBranch,
    // Script Execution
    'run-command-in-container': SquareTerminal,
    // HTTP / Webhooks
    'http-request': Webhook,
    'update-commit-status': GitCommit,
    // Image Management
    'tag-image': Tag,
    'scan-image': ShieldCheck,
    'prune-images': Trash2,
    'delete-image': Trash2,
    'delete-network': Trash2,
    'delete-volume': Trash2,
    // Files & Artifacts
    'download-file': Download,
    // Database
    'backup-volume-s3': CloudBackup,
    // Docker Swarm
    'create-service': Layers,
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
    'fetch-secrets-vault': ShieldCheck,
    'fetch-secrets-doppler': KeyRound,
    // Code Quality
    'sonarqube-scan': ScanSearch,
    // Git CI/CD
    'create-release': PackageCheck,
    'cherry-pick-commit': GitCommit,
    'merge-branch': GitMerge,
    // Domain & SSL
    'add-domain': Globe,
    'add-ssl-certificate': ShieldCheck,
};

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
    dockerfile: FileCode2,
    compose: Layers,
};
