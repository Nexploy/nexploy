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
                name="networkName"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        !networks.find((n) => n.name === field.value);

                    return (
                        <FormItem>
                            <FormLabel>{t('networkName')}</FormLabel>
                            <FormControl>
                                <Select
                                    {...field}
                                    onValueChange={field.onChange}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="w-full overflow-hidden !pl-0 data-[placeholder]:!pl-3">
                                        {isLoading ? (
                                            <span className="text-muted-foreground flex items-center gap-2 pl-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t('networksLoading')}
                                            </span>
                                        ) : isStale ? (
                                            <span className="flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                {t('networkUnavailable')}
                                            </span>
                                        ) : (
                                            <SelectValue
                                                placeholder={t('networkNamePlaceholder')}
                                            />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('networksSelectLabel')}</SelectLabel>
                                            {networks.length === 0 ? (
                                                <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                    {t('noNetworksFound')}
                                                </span>
                                            ) : (
                                                networks.map((n) => (
                                                    <SelectItem
                                                        key={n.id}
                                                        value={n.name}
                                                        className="pl-0"
                                                    >
                                                        <Status
                                                            className="m-0 flex-1 rounded-none border-0 p-0 pl-2.5 text-sm"
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
                                                                    {isBuiltinNetwork(n.name)
                                                                        ? tDocker('systemNetwork')
                                                                        : tDocker('customNetwork')}
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
