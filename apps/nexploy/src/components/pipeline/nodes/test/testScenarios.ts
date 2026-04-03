import { type TemplateEdge, type TemplateNode } from '../template/pipelineTemplates';

export type TestScenario = {
    id: string;
    name: string;
    description: string;
    nodes: TemplateNode[];
    edges: TemplateEdge[];
};

const X = 240;

export const TEST_SCENARIOS: TestScenario[] = [
    // ─────────────────────────────────────────────────────────────────────
    // 1. Full CI/CD
    // clone → set-env-vars → write-env-file → build-docker-image →
    // validate-dockerfile → tag-image → push-to-registry → deploy-container →
    // wait-for-health → save-version → update-commit-status → send-notification → clean-workdir
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'full-cicd',
        name: 'Full CI/CD',
        description:
            'Clone → build → push → deploy → notify. Couvre: clone-repository, set-env-vars, write-env-file, build-docker-image, validate-dockerfile, tag-image, push-to-registry, deploy-container, wait-for-health, save-version, update-commit-status, send-notification, clean-workdir',
        nodes: [
            { type: 'clone-repository', offsetX: 0, offsetY: 0 },
            { type: 'set-env-vars', offsetX: X, offsetY: 0 },
            { type: 'write-env-file', offsetX: X * 2, offsetY: 0 },
            { type: 'build-docker-image', offsetX: X * 3, offsetY: 0 },
            { type: 'validate-dockerfile', offsetX: X * 4, offsetY: 0 },
            { type: 'tag-image', offsetX: X * 5, offsetY: 0 },
            { type: 'push-to-registry', offsetX: X * 6, offsetY: 0 },
            { type: 'deploy-container', offsetX: X * 7, offsetY: 0 },
            { type: 'wait-for-health', offsetX: X * 8, offsetY: 0 },
            { type: 'save-version', offsetX: X * 9, offsetY: 0 },
            { type: 'update-commit-status', offsetX: X * 10, offsetY: 0 },
            { type: 'send-notification', offsetX: X * 11, offsetY: 0 },
            { type: 'clean-workdir', offsetX: X * 12, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 4, targetIndex: 5, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 5, targetIndex: 6, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 6, targetIndex: 7, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 7, targetIndex: 8, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 8, targetIndex: 9, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 9, targetIndex: 10, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 10, targetIndex: 11, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 11, targetIndex: 12, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 2. Compose + Condition Branch
    // clone-repository → validate-compose → condition
    //   [true]  → deploy-compose → wait-for-url
    //   [false] → send-notification
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'compose-condition',
        name: 'Compose + Condition Branch',
        description:
            'Clone → validate → branchement conditionnel. Couvre: webhook-clone, validate-compose, condition, deploy-compose, wait-for-url, send-notification',
        nodes: [
            { type: 'clone-repository', offsetX: 0, offsetY: 0 },
            { type: 'validate-compose', offsetX: X, offsetY: 0 },
            { type: 'condition', offsetX: X * 2, offsetY: 0 },
            { type: 'deploy-compose', offsetX: X * 3, offsetY: -130 },
            { type: 'wait-for-url', offsetX: X * 4, offsetY: -130 },
            { type: 'send-notification', offsetX: X * 3, offsetY: 130 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'true', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 5, sourceHandle: 'false', targetHandle: 'input' },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 3. Docker Container Lifecycle
    // set-environment → pull-image → create-network → create-volume →
    // start-container → wait-for-port → run-command-in-container →
    // check-container-logs → stop-container → restart-container → remove-container
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'docker-lifecycle',
        name: 'Docker Container Lifecycle',
        description:
            "Cycle de vie complet d'un container. Couvre: set-environment, pull-image, create-network, create-volume, start-container, wait-for-port, run-command-in-container, check-container-logs, stop-container, restart-container, remove-container",
        nodes: [
            { type: 'set-environment', offsetX: X * 0, offsetY: 0 },
            { type: 'pull-image', offsetX: X * 1, offsetY: 0 },
            { type: 'create-network', offsetX: X * 2, offsetY: 0 },
            { type: 'create-volume', offsetX: X * 3, offsetY: 0 },
            { type: 'start-container', offsetX: X * 4, offsetY: 0 },
            { type: 'wait-for-port', offsetX: X * 5, offsetY: 0 },
            { type: 'run-command-in-container', offsetX: X * 6, offsetY: 0 },
            { type: 'check-container-logs', offsetX: X * 7, offsetY: 0 },
            { type: 'stop-container', offsetX: X * 8, offsetY: 0 },
            { type: 'restart-container', offsetX: X * 9, offsetY: 0 },
            { type: 'remove-container', offsetX: X * 10, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 4, targetIndex: 5, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 5, targetIndex: 6, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 6, targetIndex: 7, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 7, targetIndex: 8, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 8, targetIndex: 9, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 9, targetIndex: 10, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 4. Cache & Tests
    // git-clone-extra → cache-restore → run-script → run-tests → cache-save → upload-artifact
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'cache-tests',
        name: 'Cache & Tests',
        description:
            'Clone externe → restore cache → script → tests → save cache → artifact. Couvre: git-clone-extra, cache-restore, run-script, run-tests, cache-save, upload-artifact',
        nodes: [
            { type: 'git-clone-extra', offsetX: X * 0, offsetY: 0 },
            { type: 'cache-restore', offsetX: X * 1, offsetY: 0 },
            { type: 'run-script', offsetX: X * 2, offsetY: 0 },
            { type: 'run-tests', offsetX: X * 3, offsetY: 0 },
            { type: 'cache-save', offsetX: X * 4, offsetY: 0 },
            { type: 'upload-artifact', offsetX: X * 5, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 4, targetIndex: 5, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 5. Security & Artifacts
    // clone-repository → fetch-secrets → build-docker-image → scan-image →
    // template-file → download-file → http-request → prune-images
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'security-artifacts',
        name: 'Security & Artifacts',
        description:
            'Build sécurisé avec scan et artefacts. Couvre: fetch-secrets, scan-image, template-file, download-file, http-request, prune-images',
        nodes: [
            { type: 'clone-repository', offsetX: X * 0, offsetY: 0 },
            { type: 'fetch-secrets', offsetX: X * 1, offsetY: 0 },
            { type: 'build-docker-image', offsetX: X * 2, offsetY: 0 },
            { type: 'scan-image', offsetX: X * 3, offsetY: 0 },
            { type: 'template-file', offsetX: X * 4, offsetY: 0 },
            { type: 'download-file', offsetX: X * 5, offsetY: 0 },
            { type: 'http-request', offsetX: X * 6, offsetY: 0 },
            { type: 'prune-images', offsetX: X * 7, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 4, targetIndex: 5, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 5, targetIndex: 6, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 6, targetIndex: 7, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 6. Database & Migration
    // clone-repository → write-env-file → run-migration → backup-database →
    // deploy-container → delay → prune-images
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'database-migration',
        name: 'Database & Migration',
        description:
            'Migration DB avant déploiement avec backup. Couvre: run-migration, backup-database, delay',
        nodes: [
            { type: 'clone-repository', offsetX: X * 0, offsetY: 0 },
            { type: 'write-env-file', offsetX: X * 1, offsetY: 0 },
            { type: 'run-migration', offsetX: X * 2, offsetY: 0 },
            { type: 'backup-database', offsetX: X * 3, offsetY: 0 },
            { type: 'deploy-container', offsetX: X * 4, offsetY: 0 },
            { type: 'delay', offsetX: X * 5, offsetY: 0 },
            { type: 'prune-images', offsetX: X * 6, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 4, targetIndex: 5, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 5, targetIndex: 6, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 7. Docker Swarm
    // clone-repository → build-docker-image → push-to-registry →
    // deploy-stack → update-service → scale-service → wait-for-health
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'docker-swarm',
        name: 'Docker Swarm',
        description:
            'Build et déploiement Swarm avec scaling. Couvre: deploy-stack, update-service, scale-service',
        nodes: [
            { type: 'clone-repository', offsetX: X * 0, offsetY: 0 },
            { type: 'build-docker-image', offsetX: X * 1, offsetY: 0 },
            { type: 'push-to-registry', offsetX: X * 2, offsetY: 0 },
            { type: 'deploy-stack', offsetX: X * 3, offsetY: 0 },
            { type: 'update-service', offsetX: X * 4, offsetY: 0 },
            { type: 'scale-service', offsetX: X * 5, offsetY: 0 },
            { type: 'wait-for-health', offsetX: X * 6, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 4, targetIndex: 5, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 5, targetIndex: 6, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 8. Git & Versioning
    // clone-repository → run-script → run-tests → git-tag → save-version → update-commit-status
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'git-versioning',
        name: 'Git & Versioning',
        description:
            'Tests, tag Git et versionnage. Couvre: git-tag, save-version, update-commit-status',
        nodes: [
            { type: 'clone-repository', offsetX: X * 0, offsetY: 0 },
            { type: 'run-script', offsetX: X * 1, offsetY: 0 },
            { type: 'run-tests', offsetX: X * 2, offsetY: 0 },
            { type: 'git-tag', offsetX: X * 3, offsetY: 0 },
            { type: 'save-version', offsetX: X * 4, offsetY: 0 },
            { type: 'update-commit-status', offsetX: X * 5, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 4, targetIndex: 5, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },
];
