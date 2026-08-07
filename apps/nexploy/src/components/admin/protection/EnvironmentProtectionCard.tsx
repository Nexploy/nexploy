'use client';

import { useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Switch } from '@workspace/ui/components/switch';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import {
    type EnvironmentProtectedAction,
    type EnvironmentProtectionGroup,
    environmentProtectionGroups,
    type EnvironmentProtectionPreset,
    environmentProtectionPresets,
    environmentProtectionSchema,
    type EnvironmentProtectionSchemaType,
} from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';
import { updateEnvironmentProtectionAction } from '@/actions/environment/updateEnvironmentProtection.action';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { DicebearAvatar } from '@/components/shared/DicebearAvatar.tsx';

export interface EnvironmentProtectionValue {
    id: string;
    name: string;
    isProtected: boolean;
    allowAdminBypass: boolean;
    protectedActions: EnvironmentProtectedAction[];
}

interface EnvironmentProtectionCardProps {
    environment: EnvironmentProtectionValue;
    canManage: boolean;
}

const groupNames = Object.keys(environmentProtectionGroups) as EnvironmentProtectionGroup[];
const presetNames = Object.keys(environmentProtectionPresets) as EnvironmentProtectionPreset[];

export function EnvironmentProtectionCard({ environment, canManage }: EnvironmentProtectionCardProps) {
    const t = useTranslations('admin.protection');
    const updateStoreEnvironment = useEnvironmentStore((state) => state.updateEnvironment);

    const defaultValues: EnvironmentProtectionSchemaType = {
        environmentId: environment.id,
        isProtected: environment.isProtected,
        allowAdminBypass: environment.allowAdminBypass,
        protectedActions: environment.protectedActions,
    };
    const lastSavedValues = useRef<EnvironmentProtectionSchemaType>(defaultValues);
    const pendingMessage = useRef<string | null>(null);

    const { form, action } = useHookFormAction(
        updateEnvironmentProtectionAction,
        zodResolver(environmentProtectionSchema),
        {
            formProps: { defaultValues },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (!data) return;

                    updateStoreEnvironment(environment.id, {
                        isProtected: data.isProtected,
                        allowAdminBypass: data.allowAdminBypass,
                        protectedActions: data.protectedActions,
                    });
                    lastSavedValues.current = form.getValues();
                    toast.success(pendingMessage.current ?? '');
                },
                onError: ({ error }) => {
                    form.reset(lastSavedValues.current);
                    if (error.serverError) toast.error(error.serverError);
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';
    const isProtected = form.watch('isProtected');
    const protectedActions = form.watch('protectedActions');
    const isDisabled = !canManage || isSubmitting;

    const defaultOpenGroups = useMemo(
        () =>
            groupNames.filter((group) =>
                (environmentProtectionGroups[group] as readonly EnvironmentProtectedAction[]).some((action) =>
                    environment.protectedActions.includes(action),
                ),
            ),
        [environment.protectedActions],
    );

    const commit = (values: Partial<EnvironmentProtectionSchemaType>, message: string) => {
        const nextValues = { ...form.getValues(), ...values };
        pendingMessage.current = message;
        form.reset(nextValues);
        action.execute(nextValues);
    };

    const applyPreset = (preset: EnvironmentProtectionPreset) =>
        commit(
            { protectedActions: [...environmentProtectionPresets[preset]], isProtected: true },
            t('toasts.presetApplied', { preset: t(`presetNames.${preset}` as never), name: environment.name }),
        );

    return (
        <Form {...form}>
            <Card className={'pb-2'}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <DicebearAvatar seed={environment.name} size={36} style={'glass'} alt="Environment Icon" />
                        <div className="flex flex-col">
                            <CardTitle className="flex items-center gap-2">
                                {environment.name}
                                {isProtected ? (
                                    <Badge variant="secondary" className="gap-1">
                                        <ShieldCheck className="size-3" />
                                        {t('statusProtected', { count: protectedActions.length })}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground gap-1">
                                        <ShieldOff className="size-3" />
                                        {t('statusUnprotected')}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>{t('cardDescription')}</CardDescription>
                        </div>
                    </div>
                    <FormField
                        control={form.control}
                        name="isProtected"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                <FormLabel className="cursor-pointer text-sm">
                                    {t('enable')}
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            disabled={isDisabled}
                                            onCheckedChange={(checked) =>
                                                commit(
                                                    { isProtected: checked },
                                                    t(
                                                        checked
                                                            ? 'toasts.protectionEnabled'
                                                            : 'toasts.protectionDisabled',
                                                        { name: environment.name },
                                                    ),
                                                )
                                            }
                                        />
                                    </FormControl>
                                </FormLabel>
                            </FormItem>
                        )}
                    />
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                    <FormField
                        control={form.control}
                        name="allowAdminBypass"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    className={cn(
                                        'flex items-center justify-between rounded-lg border p-4',
                                        isDisabled || !isProtected ? 'cursor-not-allowed' : 'cursor-pointer',
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-base">{t('allowAdminBypass')}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {t('allowAdminBypassDescription')}
                                        </span>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            disabled={isDisabled || !isProtected}
                                            onCheckedChange={(checked) =>
                                                commit(
                                                    { allowAdminBypass: checked },
                                                    t(
                                                        checked
                                                            ? 'toasts.adminBypassEnabled'
                                                            : 'toasts.adminBypassDisabled',
                                                        { name: environment.name },
                                                    ),
                                                )
                                            }
                                        />
                                    </FormControl>
                                </FormLabel>
                            </FormItem>
                        )}
                    />

                    {canManage && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground text-xs">{t('presets')}</span>
                            {presetNames.map((preset) => (
                                <Button
                                    key={preset}
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={isSubmitting}
                                    onClick={() => applyPreset(preset)}
                                >
                                    {t(`presetNames.${preset}` as never)}
                                </Button>
                            ))}
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={isSubmitting || protectedActions.length === 0}
                                onClick={() =>
                                    commit({ protectedActions: [] }, t('toasts.allCleared', { name: environment.name }))
                                }
                            >
                                {t('clearAll')}
                            </Button>
                        </div>
                    )}

                    <FormField
                        control={form.control}
                        name="protectedActions"
                        render={({ field }) => (
                            <FormItem className="space-y-0">
                                <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full">
                                    {groupNames.map((group) => {
                                        const actions = environmentProtectionGroups[
                                            group
                                        ] as readonly EnvironmentProtectedAction[];

                                        return (
                                            <AccordionItem key={group} value={group}>
                                                <AccordionTrigger className="text-sm cursor-pointer">
                                                    {t(`groups.${group}` as never)}
                                                </AccordionTrigger>
                                                <AccordionContent className="flex flex-col gap-2">
                                                    {actions.map((protectedAction) => {
                                                        const switchId = `${environment.id}-${protectedAction}`;

                                                        return (
                                                            <label
                                                                key={protectedAction}
                                                                htmlFor={switchId}
                                                                className={cn(
                                                                    'flex items-center justify-between gap-4 rounded-lg border p-4',
                                                                    isDisabled || !isProtected
                                                                        ? 'cursor-not-allowed'
                                                                        : 'cursor-pointer',
                                                                )}
                                                            >
                                                                <span className="flex flex-col">
                                                                    <span className="text-base">
                                                                        {t(`actions.${protectedAction}.label` as never)}
                                                                    </span>
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {t(
                                                                            `actions.${protectedAction}.description` as never,
                                                                        )}
                                                                    </span>
                                                                </span>
                                                                <Switch
                                                                    id={switchId}
                                                                    checked={field.value.includes(protectedAction)}
                                                                    disabled={isDisabled || !isProtected}
                                                                    onCheckedChange={(checked) =>
                                                                        commit(
                                                                            {
                                                                                protectedActions: checked
                                                                                    ? [...field.value, protectedAction]
                                                                                    : field.value.filter(
                                                                                          (value) =>
                                                                                              value !== protectedAction,
                                                                                      ),
                                                                            },
                                                                            t(
                                                                                checked
                                                                                    ? 'toasts.actionProtected'
                                                                                    : 'toasts.actionUnprotected',
                                                                                {
                                                                                    action: t(
                                                                                        `actions.${protectedAction}.label` as never,
                                                                                    ),
                                                                                    name: environment.name,
                                                                                },
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </label>
                                                        );
                                                    })}
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </Form>
    );
}
