'use client';

import { type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { type NodeData, type NodeId } from '@workspace/typescript-interface/pipeline/node';
import { type Node } from '@xyflow/react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@workspace/ui/components/dialog';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveNodeConfigAction } from '@/actions/repository/pipeline/saveNodeConfig.action';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { CONFIG_PANELS, CONFIG_SCHEMAS, HAS_CONFIG_SCHEMA } from './nodeConfigRegistry';
import { cn } from '@workspace/ui/lib/utils';

function computeDefaultValues(
    schema: any,
    nodeConfig: Record<string, unknown>,
): Record<string, unknown> {
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
    const t = useTranslations('repository.pipeline.nodes');
    const tConfig = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');

    const data = node.data as unknown as NodeData;
    const nodeName = data.definition?.metadata.name;
    const nodeDesc = data.definition?.metadata.description;

    const params = useParams<{ repositoryId: string }>();
    const { handleConfigChange, handleResetPanelNode, isViewingBuild } = usePipelineContext();

    const nodeType = node.data.nodeType as NodeId;
    const nodeConfig = node.data.config ?? {};
    const schema = CONFIG_SCHEMAS[nodeType];
    const ConfigComponent = CONFIG_PANELS[nodeType];
    const hasSchema = HAS_CONFIG_SCHEMA[nodeType];

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        saveNodeConfigAction.bind(null, params.repositoryId, node.id),
        zodResolver(schema),
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

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        handleSubmitWithAction(e);
    };

    if (!ConfigComponent) {
        return (
            <div className="flex flex-1 flex-col gap-4">
                {!isViewingBuild && (
                    <DialogHeader>
                        <DialogTitle>{t(nodeName)}</DialogTitle>
                        {nodeDesc && (
                            <DialogDescription className={'text-xs'}>
                                {t(nodeDesc)}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                )}
                <DialogFooter className="px-6 pb-6">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetPanelNode}
                    >
                        {tCommon('close')}
                    </Button>
                </DialogFooter>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col">
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <fieldset
                        disabled={isViewingBuild}
                        className={cn(
                            'grid grid-cols-1 p-4',
                            isViewingBuild && 'pointer-events-none',
                        )}
                    >
                        <ConfigComponent />
                    </fieldset>
                </ScrollAreaWithShadow>

                {!isViewingBuild && hasSchema && (
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
                            disabled={!form.formState.isDirty || action.isPending}
                        >
                            {action.isPending && <Loader2 className="animate-spin" />}
                            {tConfig('save')}
                        </Button>
                    </DialogFooter>
                )}
            </form>
        </Form>
    );
}
