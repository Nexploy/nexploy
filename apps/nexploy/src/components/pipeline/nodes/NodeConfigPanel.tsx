'use client';

import { type ComponentType, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import { type Node } from '@xyflow/react';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
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
import { SendNotificationConfig } from './config/SendNotificationConfig';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useAction } from 'next-safe-action/hooks';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { flowToGraph } from '@/components/pipeline/utils/graphConvert';
import { useParams } from 'next/navigation';
import {
    buildDockerImageConfigSchema,
    composeFileConfigSchema,
    sendNotificationConfigSchema,
    setEnvVarsConfigSchema,
    validateDockerfileConfigSchema,
} from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { toast } from 'sonner';

export interface NodeConfigProps {
    config: Record<string, unknown>;
    update: (key: string, value: unknown) => void;
}

interface NodeConfigPanelProps {
    node: Node;
    isOpen: boolean;
}

function zodValidator(schema: {
    safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } };
}) {
    return (config: Record<string, unknown>): string | null => {
        const result = schema.safeParse(config);
        if (result.success) return null;
        return result.error?.issues[0]?.message ?? 'Invalid configuration';
    };
}

const VALIDATORS: Partial<Record<NodeType, (config: Record<string, unknown>) => string | null>> = {
    'set-env-vars': zodValidator(setEnvVarsConfigSchema),
    'build-docker-image': zodValidator(buildDockerImageConfigSchema),
    'validate-dockerfile': zodValidator(validateDockerfileConfigSchema),
    'validate-compose': zodValidator(composeFileConfigSchema),
    'deploy-compose': zodValidator(composeFileConfigSchema),
    'send-notification': zodValidator(sendNotificationConfigSchema),
};

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
    'send-notification': SendNotificationConfig,
};

export function NodeConfigPanel({ node, isOpen }: NodeConfigPanelProps) {
    const t = useTranslations('repository.pipeline');
    const tConfig = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');

    const params = useParams<{ repositoryId: string }>();
    const { nodes, edges, handleConfigChange, handlePaneClick } = usePipelineContext();

    const { executeAsync: savePipelineAsync } = useAction(savePipelineAction);

    const handleNodeSave = useCallback(
        async (nodeId: string, config: Record<string, unknown>) => {
            const updatedNodes = nodes.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
            );
            await savePipelineAsync({
                repositoryId: params.repositoryId,
                graph: flowToGraph(updatedNodes, edges),
            });
        },
        [nodes, edges, params.repositoryId],
    );

    const nodeType = node.data.pipelineNodeType as NodeType;
    const nodeConfig = (node.data.config as Record<string, unknown>) ?? {};

    const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(nodeConfig);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const def = getNodeDefinition(nodeType);
    if (!def) return null;

    const ConfigComponent = CONFIG_PANELS[nodeType];

    const update = (key: string, value: unknown) => {
        setLocalConfig((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleCancel = () => {
        setLocalConfig((node.data.config as Record<string, unknown>) ?? {});
        setIsDirty(false);
        handlePaneClick();
    };

    const handleSave = async () => {
        const validator = VALIDATORS[nodeType];
        if (validator) {
            const error = validator(localConfig);
            if (error) {
                toast.error(error);
                return;
            }
        }
        setIsSaving(true);
        try {
            handleConfigChange(node.id, localConfig);
            await handleNodeSave(node.id, localConfig);
            setIsDirty(false);
            handlePaneClick();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="overflow-hidden">
                <div className="flex max-h-[90vh] flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle className="text-sm">
                            {t(`nodes.${nodeType}.name` as never)}
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollAreaWithShadow bottomShadow className="h-full">
                        <div className={'px-6 pb-6'}>
                            <ConfigComponent config={localConfig} update={update} />
                        </div>
                    </ScrollAreaWithShadow>

                    <DialogFooter className={'px-6 pb-6'}>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                            {tCommon('cancel')}
                        </Button>
                        <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
                            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                            {tConfig('save')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
