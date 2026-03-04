import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Key, Pencil, Plus } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { EnvForm } from '@/components/docker/container/forms/EnvForm';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { Badge } from '@workspace/ui/components/badge';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';

type EnvVar = { key: string; value: string };

function parseEnvString(envString: string): EnvVar {
    const [key, ...valueParts] = envString.split('=');
    return { key: key!, value: valueParts.join('=') };
}

interface EnvVarItemProps {
    env: EnvVar;
    isEdited: boolean;
    isDeleted: boolean;
    isNew?: boolean;
    displayEnvVar: EnvVar;
    onEdit: (envVar: EnvVar, originalEnvVar?: EnvVar) => void;
}

function EnvVarItem({ env, isEdited, isDeleted, isNew, displayEnvVar, onEdit }: EnvVarItemProps) {
    const t = useTranslations('docker.containerEnv');
    const statusIndicator = isNew ? (
        <span className="text-green-500">+</span>
    ) : isEdited ? (
        <span className="text-primary">*</span>
    ) : isDeleted ? (
        <span className="text-destructive">-</span>
    ) : null;

    return (
        <div className="bg-muted/60 flex items-center justify-between gap-2 rounded-md p-2">
            <code className="flex gap-2 text-sm leading-none">
                <span className="text-primary shrink-0 text-xs font-semibold">
                    {displayEnvVar.key}:
                </span>
                <span className="text-xs break-all">{displayEnvVar.value || t('empty')}</span>
                {statusIndicator}
            </code>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => onEdit(displayEnvVar, isNew ? undefined : env)}
                    >
                        <Pencil />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{t('edit')}</TooltipContent>
            </Tooltip>
        </div>
    );
}

export function CardEnv() {
    const container = useContainerStore((state) => state.container);
    const { openDialog } = useConfirmationDialogStore();
    const envVarChanges = useContainerChangesStore((state) => state.envVarChanges);
    const t = useTranslations('docker.containerEnv');

    const handleOpenDialog = (mode: 'add' | 'edit', envVar?: EnvVar, originalEnvVar?: EnvVar) => {
        openDialog({
            closeOnBackground: true,
            title: mode === 'add' ? t('addTitle') : t('editTitle'),
            description: mode === 'add' ? t('addDescription') : t('editDescription'),
            props: {
                className: 'sm:max-w-[425px]',
            },
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

    if (!container) {
        return <Skeleton className="h-100 flex-1" />;
    }

    const addedEnvVars = envVarChanges.filter((change) => change.typeAction === 'add');
    const hasEnvVars = container.env.length > 0 || addedEnvVars.length > 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardHeaderWithIcon as={'div'} icon={Key} title={t('title')}>
                        <Badge variant={'secondary'}>
                            {container.env.length + addedEnvVars.length}
                        </Badge>
                    </CardHeaderWithIcon>
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
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {hasEnvVars ? (
                    <ScrollAreaWithShadow
                        colorShadow="from-card via-card/50"
                        bottomShadow
                        className="h-72 overflow-hidden px-6"
                    >
                        <div className="space-y-2">
                            {container.env.map((envString, idx) => {
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
                                        onEdit={handleOpenDialog.bind(null, 'edit')}
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
                                    onEdit={handleOpenDialog.bind(null, 'edit')}
                                />
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                ) : (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noVariables')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
