'use client';

import { type ComponentType, useState } from 'react';
import { useTranslations } from 'next-intl';
import { NodeType, PipelineNode } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { Button } from '@workspace/ui/components/button';
import { X } from 'lucide-react';
import { CloneRepositoryConfig } from './config/CloneRepositoryConfig';
import { BuildDockerImageConfig } from './config/BuildDockerImageConfig';
import { ValidateDockerfileConfig } from './config/ValidateDockerfileConfig';
import { ValidateComposeConfig } from './config/ValidateComposeConfig';
import { DeployContainerConfig } from './config/DeployContainerConfig';
import { DeployComposeConfig } from './config/DeployComposeConfig';
import { PushToRegistryConfig } from './config/PushToRegistryConfig';
import { WriteEnvFileConfig } from './config/WriteEnvFileConfig';
import { SetEnvVarsConfig } from './config/SetEnvVarsConfig';
import { CleanWorkdirConfig } from './config/CleanWorkdirConfig';
import { RunScriptConfig } from './config/RunScriptConfig';
import { SendNotificationConfig } from './config/SendNotificationConfig';

export interface NodeConfigProps {
    config: Record<string, unknown>;
    update: (key: string, value: unknown) => void;
}

interface NodeConfigPanelProps {
    node: PipelineNode;
}

const CONFIG_PANELS: Record<NodeType, ComponentType<NodeConfigProps>> = {
    'clone-repository': CloneRepositoryConfig,
    'build-docker-image': BuildDockerImageConfig,
    'validate-dockerfile': ValidateDockerfileConfig,
    'validate-compose': ValidateComposeConfig,
    'deploy-container': DeployContainerConfig,
    'deploy-compose': DeployComposeConfig,
    'push-to-registry': PushToRegistryConfig,
    'write-env-file': WriteEnvFileConfig,
    'set-env-vars': SetEnvVarsConfig,
    'clean-workdir': CleanWorkdirConfig,
    'run-script': RunScriptConfig,
    'send-notification': SendNotificationConfig,
};

export function NodeConfigPanel({ node }: NodeConfigPanelProps) {
    const t = useTranslations('repository.pipeline');
    const tConfig = useTranslations('repository.pipeline.config');
    const { handleConfigChange, handlePaneClick, triggerAutoSave } = usePipelineContext();

    const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(node.data.config);
    const [isDirty, setIsDirty] = useState(false);

    const def = getNodeDefinition(node.data.type);
    if (!def) return null;

    const ConfigComponent = CONFIG_PANELS[node.data.type as NodeType];

    const update = (key: string, value: unknown) => {
        setLocalConfig((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        handleConfigChange(node.id, localConfig);
        triggerAutoSave();
        setIsDirty(false);
    };

    return (
        <div className="border-border bg-sidebar flex w-60 shrink-0 flex-col border-l">
            <div className="border-border flex items-center justify-between border-b px-3 py-3">
                <h3 className="text-foreground text-xs font-semibold">
                    {t(`nodes.${node.data.type}.name` as never)}
                </h3>
                <button
                    onClick={handlePaneClick}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-5 items-center justify-center rounded transition-colors"
                >
                    <X className="size-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-3">
                {ConfigComponent ? <ConfigComponent config={localConfig} update={update} /> : null}
                <Button
                    size="sm"
                    disabled={!isDirty}
                    className="self-end text-xs"
                    onClick={handleSave}
                >
                    {tConfig('save')}
                </Button>
            </div>
        </div>
    );
}
