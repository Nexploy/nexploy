'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId';
import { useEnvironmentNetworks } from '@/hooks/sse/useEnvironmentNetworks';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { isBuiltinNetwork } from '@workspace/shared/nexployFilter';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function DeleteNetworkConfig() {
    const t = useTranslations('repository.pipeline.config');
    const tDocker = useTranslations('docker.tables');
    const form = useFormContext();

    const environmentId = usePipelineEnvironmentId();
    const { networks, isLoading } = useEnvironmentNetworks(environmentId);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="networkId"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        !isNodeFieldRef(field.value) &&
                        !networks.find((n) => n.id === field.value);

                    return (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('networkId')}</FormLabel>
                            <FormControl>
                                {isLoading ? (
                                    <p className="text-muted-foreground bg-input/30 border-input flex h-9 items-center gap-1 rounded-md border px-3 py-2 text-sm">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {t('networksLoading')}
                                    </p>
                                ) : (
                                    <RefAware value={field.value} onChange={field.onChange}>
                                        <Select
                                            {...field}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="max-w-full overflow-hidden !pl-0 data-[placeholder]:!pl-3">
                                                {isStale ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                        {t('networkUnavailable')}
                                                    </span>
                                                ) : (
                                                    <SelectValue
                                                        placeholder={t('networkIdPlaceholder')}
                                                    />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>
                                                        {t('networksSelectLabel')}
                                                    </SelectLabel>
                                                    {networks.length === 0 ? (
                                                        <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                            {t('noNetworksFound')}
                                                        </span>
                                                    ) : (
                                                        networks.map((n) => (
                                                            <SelectItem
                                                                key={n.id}
                                                                value={n.id}
                                                                className="pl-0"
                                                            >
                                                                <Status
                                                                    className="m-0 w-full rounded-none border-0 p-0 pl-2.5 text-sm"
                                                                    status={
                                                                        isBuiltinNetwork(n.name)
                                                                            ? 'maintenance'
                                                                            : 'online'
                                                                    }
                                                                    variant="outline"
                                                                >
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <StatusIndicator className="pl-2" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            {isBuiltinNetwork(
                                                                                n.name,
                                                                            )
                                                                                ? tDocker(
                                                                                      'systemNetwork',
                                                                                  )
                                                                                : tDocker(
                                                                                      'customNetwork',
                                                                                  )}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <span className="truncate">
                                                                        {n.name}
                                                                    </span>
                                                                </Status>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </RefAware>
                                )}
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="force"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('force')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
