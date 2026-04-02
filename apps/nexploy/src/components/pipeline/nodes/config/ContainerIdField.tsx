'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { findAncestor } from '@/inngest/pipeline/utils/graphQueries';
import * as React from 'react';
import { useMemo } from 'react';
import { useEnvironmentContainers } from '@/hooks/sse/useEnvironmentContainers';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';

function stripLeadingSlash(name: string) {
    return name.startsWith('/') ? name.slice(1) : name;
}

export function ContainerIdField() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();

    const { nodes, edges } = usePipelineContext();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    const environmentId = useMemo(() => {
        if (!panelNodeId) return null;
        const ancestor = findAncestor(
            panelNodeId,
            nodes,
            edges,
            (data) => data.nodeType === 'set-environment' && !data.disabled,
        );
        return ancestor?.data.config?.environmentId;
    }, []);

    const { containers, isLoading } = useEnvironmentContainers(environmentId);

    const savedContainerName = form.watch('containerName');

    return (
        <FormField
            control={form.control}
            name="containerId"
            render={({ field }) => {
                const isStale =
                    !isLoading &&
                    !!environmentId &&
                    !!field.value &&
                    containers.length >= 0 &&
                    !containers.find((container) => container.id === field.value);

                return (
                    <FormItem>
                        <FormLabel>{t('containerName')}</FormLabel>
                        <FormControl>
                            {environmentId ? (
                                <Select
                                    value={field.value ?? ''}
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const container = containers.find((c) => c.id === value);
                                        if (container) {
                                            form.setValue(
                                                'containerName',
                                                stripLeadingSlash(container.name),
                                            );
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className={'!pl-0 data-[placeholder]:!pl-3'}>
                                        {isLoading ? (
                                            <span className="text-muted-foreground flex items-center gap-2 pl-3 text-xs">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t('containersLoading')}
                                            </span>
                                        ) : isStale ? (
                                            <span className="flex items-center gap-1.5 pl-3 text-xs">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                {savedContainerName
                                                    ? savedContainerName
                                                    : t('containerUnavailable')}
                                            </span>
                                        ) : (
                                            <SelectValue
                                                placeholder={t('containerNamePlaceholder')}
                                            />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('containersSelectLabel')}</SelectLabel>
                                            {containers.length === 0 ? (
                                                <div className="text-muted-foreground px-2 py-1.5 text-xs">
                                                    {t('noContainersFound')}
                                                </div>
                                            ) : (
                                                containers.map((container) => {
                                                    const name = stripLeadingSlash(container.name);
                                                    return (
                                                        <SelectItem
                                                            key={container.id}
                                                            value={container.id}
                                                            className="pl-0 text-xs"
                                                        >
                                                            <Status
                                                                className="m-0 max-w-72 rounded-none border-0 p-0 pl-2.5"
                                                                status={
                                                                    container.state === 'running'
                                                                        ? 'online'
                                                                        : 'offline'
                                                                }
                                                                variant="outline"
                                                            >
                                                                <StatusIndicator className="pl-2" />
                                                                {name.length >= 50 ? (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="truncate">
                                                                                {name}
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <span className="truncate">
                                                                                {name}
                                                                            </span>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <span className="truncate">
                                                                        {name}
                                                                    </span>
                                                                )}
                                                            </Status>
                                                        </SelectItem>
                                                    );
                                                })
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <>
                                    <Input
                                        {...field}
                                        placeholder={t('containerNamePlaceholder')}
                                        className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                                    />
                                    <p className="text-muted-foreground flex items-start gap-1 text-xs">
                                        <Info className="mt-0.5 h-3 w-3 shrink-0" />
                                        <div>
                                            {t.rich('containerNoEnvironmentHint', {
                                                bold: (chunks) => (
                                                    <span className="font-bold">{chunks}</span>
                                                ),
                                            })}
                                        </div>
                                    </p>
                                </>
                            )}
                        </FormControl>
                        {isStale && (
                            <p className="flex items-start gap-1 text-xs text-amber-500">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                {t('containerStaleWarning')}
                            </p>
                        )}
                        <FormMessage className="text-xs" />
                    </FormItem>
                );
            }}
        />
    );
}
