'use client';

import { useTranslations } from 'next-intl';
import { type NodeId } from '@workspace/typescript-interface/pipeline/node';
import { type Node } from '@xyflow/react';
import { usePipelineActions, useIsViewingBuild } from '@/stores/pipeline/usePipelineStore';
import { Button } from '@workspace/ui/components/button';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveNodeConfigAction } from '@/actions/repository/pipeline/saveNodeConfig.action';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
    getConfigPanel,
    getConfigSchema,
    hasConfigSchema,
} from '@/components/pipeline/nodeManifestRegistry';
import { cn } from '@workspace/ui/lib/utils';
import { usePermissions } from '@/contexts/PermissionContext';

function computeDefaultValues(schema: any, nodeConfig: Record<string, unknown>) {
    const schemaDefaults: Record<string, unknown> = {};
    const shape: Record<string, any> | undefined = schema?.shape;
    if (shape) {
        for (const [key, fieldSchema] of Object.entries(shape)) {
            const result = (fieldSchema as any).safeParse(undefined);
            schemaDefaults[key] = result.success ? result.data : undefined;
        }
    }
    return { ...schemaDefaults, ...nodeConfig };
}

interface NodeConfigFormProps {
    node: Node;
}

export function NodeConfigForm({ node }: NodeConfigFormProps) {
    const tConfig = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');

    const params = useParams<{ repositoryId: string }>();
    const { handleConfigChange, handleResetPanelNode } = usePipelineActions();
    const isViewingBuild = useIsViewingBuild();
    const { can } = usePermissions();
    const canEdit = can('repository', 'update');

    const nodeType = node.data.nodeType as NodeId;
    const nodeConfig = node.data.config ?? {};
    const schema = getConfigSchema(nodeType);
    const ConfigComponent = getConfigPanel(nodeType);
    const hasSchema = hasConfigSchema(nodeType);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        saveNodeConfigAction.bind(null, params.repositoryId, node.id),
        zodResolver(schema as any),
        {
            formProps: {
                defaultValues: computeDefaultValues(schema, nodeConfig as Record<string, unknown>),
            },
            actionProps: {
                onSuccess: ({ data: config }) => {
                    if (config) {
                        handleConfigChange(node.id, config);
                        form.reset(config);
                    }
                    handleResetPanelNode();
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? tConfig('saveError'));
                },
            },
        },
    );

    return (
        <Form {...form}>
            <form
                onSubmit={handleSubmitWithAction}
                className="flex min-w-0 flex-1 flex-col overflow-hidden"
            >
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <fieldset
                        disabled={isViewingBuild || !canEdit}
                        className={cn(
                            'grid grid-cols-1 p-4',
                            (isViewingBuild || !canEdit) && 'pointer-events-none',
                        )}
                    >
                        {ConfigComponent && <ConfigComponent />}
                    </fieldset>
                </ScrollAreaWithShadow>

                {!isViewingBuild && canEdit && hasSchema && (
                    <DialogFooter className={cn('bg-muted/40 border-t p-4')}>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetPanelNode}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            isLoading={action.isPending}
                            disabled={!form.formState.isDirty || action.isPending}
                        >
                            {tConfig('save')}
                        </Button>
                    </DialogFooter>
                )}
            </form>
        </Form>
    );
}
