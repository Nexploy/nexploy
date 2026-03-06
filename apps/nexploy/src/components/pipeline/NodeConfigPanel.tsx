'use client';

import { useTranslations } from 'next-intl';
import { NodeType, PipelineNode } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/lib/pipeline/nodeRegistry';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { X } from 'lucide-react';

interface NodeConfigPanelProps {
    node: PipelineNode;
}

export function NodeConfigPanel({ node }: NodeConfigPanelProps) {
    const t = useTranslations('repository.pipeline');
    const { handleConfigChange, handlePaneClick } = usePipelineContext();

    const def = getNodeDefinition(node.data.type);
    const config = node.data.config;

    const update = (key: string, value: unknown) => {
        handleConfigChange(node.id, { ...config, [key]: value });
    };

    if (!def) return null;

    const renderFields = () => {
        switch (node.data.type as NodeType) {
            case 'clone-repository':
                return (
                    <p className="text-muted-foreground text-xs">
                        {t('nodes.clone-repository.noConfig')}
                    </p>
                );

            case 'build-docker-image':
                return (
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">
                            {t('config.dockerfilePath')}
                        </Label>
                        <Input
                            value={(config.dockerfilePath as string) ?? 'Dockerfile'}
                            onChange={(e) => update('dockerfilePath', e.target.value)}
                            placeholder="Dockerfile"
                            className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                        />
                    </div>
                );

            case 'deploy-container':
                return (
                    <p className="text-muted-foreground text-xs">
                        {t('config.deployContainerInfo')}
                    </p>
                );

            case 'write-env-file':
                return (
                    <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground text-xs">
                            {t('config.useRepositoryEnvVars')}
                        </Label>
                        <Switch
                            checked={(config.useRepositoryEnvVars as boolean) ?? true}
                            onCheckedChange={(v) => update('useRepositoryEnvVars', v)}
                        />
                    </div>
                );

            case 'run-script':
                return (
                    <>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground text-xs">
                                {t('config.script')}
                            </Label>
                            <Textarea
                                value={(config.script as string) ?? ''}
                                onChange={(e) => update('script', e.target.value)}
                                placeholder="echo hello"
                                rows={6}
                                className="border-border bg-background text-foreground focus:border-primary font-mono text-xs"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-muted-foreground text-xs">
                                {t('config.failOnError')}
                            </Label>
                            <Switch
                                checked={(config.failOnError as boolean) ?? true}
                                onCheckedChange={(v) => update('failOnError', v)}
                            />
                        </div>
                    </>
                );

            case 'send-notification':
                return (
                    <>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground text-xs">
                                {t('config.webhookUrl')}
                            </Label>
                            <Input
                                value={(config.webhookUrl as string) ?? ''}
                                onChange={(e) => update('webhookUrl', e.target.value)}
                                placeholder="https://hooks.example.com/…"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground text-xs">
                                {t('config.message')}
                            </Label>
                            <Input
                                value={(config.message as string) ?? ''}
                                onChange={(e) => update('message', e.target.value || undefined)}
                                placeholder={t('config.messagePlaceholder')}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="border-border bg-sidebar flex w-60 shrink-0 flex-col border-l">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-foreground text-xs font-semibold">
                        {t(`nodes.${node.data.type}.name`)}
                    </h3>
                </div>
                <button
                    onClick={handlePaneClick}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-5 items-center justify-center rounded transition-colors"
                >
                    <X className="size-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-4">{renderFields()}</div>
        </div>
    );
}
