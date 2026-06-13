import { sonarqubeScanConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { SonarqubeScanConfig } from '../config/SonarqubeScanConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { ScanSearch } from 'lucide-react';

export const sonarqubeScanManifest: NodeManifest = {
    type: 'sonarqube-scan',
    definition: {
        id: 'sonarqube-scan',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'sonarqube-scan.name',
            description: 'sonarqube-scan.description',
            icon: ScanSearch,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: sonarqubeScanConfigSchema,
    configPanel: SonarqubeScanConfig,
    inputFields: [
        {
            key: 'qualityGatePassed',
            labelKey: 'pipeline.inputs.qualityGatePassed',
            descriptionKey: 'pipeline.inputs.desc_qualityGatePassed',
            type: 'input',
        },
        {
            key: 'projectKey',
            labelKey: 'pipeline.inputs.projectKey',
            descriptionKey: 'pipeline.inputs.desc_projectKey',
            type: 'input',
        },
        {
            key: 'score',
            labelKey: 'pipeline.inputs.score',
            descriptionKey: 'pipeline.inputs.desc_score',
            type: 'input',
        },
    ],
};
