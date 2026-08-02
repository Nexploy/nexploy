import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { sonarqubeScanConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const sonarqubeScanDescriptor: NodeDescriptor = {
    type: 'sonarqube-scan',
    category: 'build',
    icon: 'ScanSearch',
    description:
        'Runs a SonarQube code quality analysis. Can fail the pipeline on the quality gate and/or when a metric (e.g. coverage) is below a required minimum score.',
    consumesFromUpstream: ['workDir'],
    configSchema: sonarqubeScanConfigSchema,
    outputs: [{ key: 'qualityGatePassed' }, { key: 'projectKey' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
