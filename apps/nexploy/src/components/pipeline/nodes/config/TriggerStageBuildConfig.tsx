'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { usePipelineStageId } from '@/stores/pipeline/usePipelineStore';

interface StageOption {
    id: string;
    name: string;
    isProduction: boolean;
}

export function TriggerStageBuildConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const params = useParams<{ repositoryId: string }>();
    const currentStageId = usePipelineStageId();

    const { data: stages, isLoading } = useSWR<StageOption[]>(
        params.repositoryId ? { url: `/api/repositories/${params.repositoryId}/stages` } : null,
        fetcherApi,
    );

    const targetStages = (stages ?? []).filter((s) => s.id !== currentStageId);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="stageId"
                render={({ field }) => {
                    const isStale =
                        !isLoading &&
                        !!field.value &&
                        !targetStages.find((s) => s.id === field.value);

                    return (
                        <FormItem>
                            <FormLabel>{t('targetStage')}</FormLabel>
                            <Select
                                {...field}
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    const selected = targetStages.find((s) => s.id === value);
                                    form.setValue('stageName', selected?.name ?? '');
                                }}
                                disabled={isLoading}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        {isLoading ? (
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                {t('stagesLoading')}
                                            </span>
                                        ) : isStale ? (
                                            <span className="flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                                {t('stageUnavailable')}
                                            </span>
                                        ) : (
                                            <SelectValue placeholder={t('selectTargetStage')} />
                                        )}
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('targetStage')}</SelectLabel>
                                        {targetStages.length === 0 ? (
                                            <span className="text-muted-foreground px-2 py-1.5 text-sm">
                                                {t('noStagesFound')}
                                            </span>
                                        ) : (
                                            targetStages.map((stage) => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {isStale && (
                                <p className="flex items-start gap-1 text-xs text-amber-500">
                                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                    {t('stageStaleWarning')}
                                </p>
                            )}
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />

            <FormField
                control={form.control}
                name="triggerOnFailure"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                        <FormLabel>{t('triggerOnFailure')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
