import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Key, Plus } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { EnvForm } from '@/components/docker/container/forms/EnvForm';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { type EnvVar, EnvVarItem } from './EnvVarItem';

function parseEnvString(envString: string): EnvVar {
    const [key, ...valueParts] = envString.split('=');
    return { key: key!, value: valueParts.join('=') };
}

export function CardEnv() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const { openDialog } = useConfirmationDialogStore();
    const envVarChanges = useContainerChangesStore((state) => state.envVarChanges);
    const onEnvVarChange = useContainerChangesStore((state) => state.onEnvVarChange);
    const isSwarmContainer = useContainerStore(
        (state) => !!state.container?.labels?.['com.docker.swarm.service.id'],
    );
    const t = useTranslations('docker.containerEnv');

    const handleOpenDialog = (mode: 'add' | 'edit', envVar?: EnvVar, originalEnvVar?: EnvVar) => {
        openDialog({
            title: mode === 'add' ? t('addTitle') : t('editTitle'),
            description: mode === 'add' ? t('addDescription') : t('editDescription'),
            content: <EnvForm mode={mode} defaultEnvVar={envVar} originalEnvVar={originalEnvVar} />,
        });
    };

    const getEnvChangeStatus = (env: EnvVar) => {
        const editChange = envVarChanges.find(
            (change) =>
                change.typeAction === 'edit' &&
                change.currentKey === env.key &&
                change.currentValue === env.value,
        );

        const deleteChange = envVarChanges.find(
            (change) =>
                change.typeAction === 'delete' &&
                change.currentKey === env.key &&
                change.currentValue === env.value,
        );

        return {
            isEdited: !!editChange,
            isDeleted: !!deleteChange,
            editedEnvVar: editChange ? { key: editChange.key!, value: editChange.value! } : null,
        };
    };

    if (isConnecting) {
        return <Skeleton className="h-100 flex-1" />;
    }

    const addedEnvVars = envVarChanges.filter((change) => change.typeAction === 'add');
    const hasEnvVars = (container?.env.length ?? 0) > 0 || addedEnvVars.length > 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardHeaderWithIcon as={'div'} icon={Key} title={t('title')} />
                    {!isSwarmContainer && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className="size-9 md:size-fit"
                                    icon={Plus}
                                    onClick={() => handleOpenDialog('add')}
                                >
                                    <span className="hidden md:flex">{t('addVariable')}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="flex xl:hidden">
                                <span>{t('addVariable')}</span>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {!hasEnvVars ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noVariables')}
                    </div>
                ) : (
                    <ScrollAreaWithShadow
                        colorShadow="from-card via-card/50"
                        bottomShadow
                        className="h-72 overflow-hidden px-6"
                    >
                        <div className="space-y-2">
                            {container?.env.map((envString, idx) => {
                                const env = parseEnvString(envString);
                                const { isEdited, isDeleted, editedEnvVar } =
                                    getEnvChangeStatus(env);
                                const displayEnvVar = editedEnvVar || env;

                                return (
                                    <EnvVarItem
                                        key={idx}
                                        env={env}
                                        isEdited={isEdited}
                                        isDeleted={isDeleted}
                                        displayEnvVar={displayEnvVar}
                                        onEdit={
                                            isSwarmContainer
                                                ? undefined
                                                : handleOpenDialog.bind(null, 'edit')
                                        }
                                        onCancelDelete={
                                            isSwarmContainer
                                                ? undefined
                                                : () =>
                                                      onEnvVarChange({
                                                          typeAction: 'add',
                                                          key: env.key,
                                                          value: env.value,
                                                          currentKey: env.key,
                                                      })
                                        }
                                    />
                                );
                            })}

                            {addedEnvVars.map(({ key, value }, idx) => (
                                <EnvVarItem
                                    key={`new-${idx}`}
                                    env={{ key: key!, value: value! }}
                                    isEdited={false}
                                    isDeleted={false}
                                    isNew
                                    displayEnvVar={{ key: key!, value: value! }}
                                    onEdit={
                                        isSwarmContainer
                                            ? undefined
                                            : handleOpenDialog.bind(null, 'edit')
                                    }
                                />
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
