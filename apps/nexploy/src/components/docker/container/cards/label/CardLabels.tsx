import { Card, CardContent } from '@workspace/ui/components/card';
import { Plus, Tags } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { LabelForm } from '@/components/docker/container/forms/LabelForm';
import { Label } from '@workspace/typescript-interface/docker/docker.label';
import { LabelItem } from '@/components/docker/container/cards/label/LabelItem';
import { useTranslations } from 'next-intl';
import { useIsSwarmContainer } from '@/hooks/useIsSwarmContainer';

export function CardLabels() {
    const t = useTranslations('docker.labels');
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const { openDialog } = useConfirmationDialogStore();
    const labelChanges = useContainerChangesStore((state) => state.labelChanges);
    const onLabelChange = useContainerChangesStore((state) => state.onLabelChange);
    const isSwarmContainer = useIsSwarmContainer();

    const handleOpenDialog = (mode: 'add' | 'edit', label?: Label, originalLabel?: Label) => {
        openDialog({
            closeOnBackground: true,
            title: mode === 'add' ? t('addLabel') : t('editLabel'),
            description: t('containerMustBeStopped'),
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <LabelForm mode={mode} defaultLabel={label} originalLabel={originalLabel} />,
        });
    };

    const getLabelChangeStatus = (label: Label) => {
        const editChange = labelChanges.find(
            (change) =>
                change.typeAction === 'edit' &&
                change.currentKey === label.key &&
                change.currentValue === label.value,
        );

        const deleteChange = labelChanges.find(
            (change) =>
                change.typeAction === 'delete' &&
                change.currentKey === label.key &&
                change.currentValue === label.value,
        );

        return {
            isEdited: !!editChange,
            isDeleted: !!deleteChange,
            editedLabel: editChange ? { key: editChange.key!, value: editChange.value! } : null,
        };
    };

    if (isConnecting) {
        return <Skeleton className="h-100 flex-1" />;
    }

    const addedLabels = labelChanges.filter((change) => change.typeAction === 'add');
    const labelCount = (Object.keys(container?.labels ?? {}).length ?? 0) + addedLabels.length;

    return (
        <Card>
            <CardHeaderWithIcon icon={Tags} title={t('title')} className={'justify-between'}>
                {!isSwarmContainer && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="size-9 md:size-fit"
                                icon={Plus}
                                onClick={() => handleOpenDialog('add')}
                            >
                                <span className="hidden md:flex">{t('add')}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="flex xl:hidden">
                            <span>{t('add')}</span>
                        </TooltipContent>
                    </Tooltip>
                )}
            </CardHeaderWithIcon>
            <CardContent className="px-0">
                {!labelCount ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noLabels')}
                    </div>
                ) : (
                    <ScrollAreaWithShadow
                        colorShadow="from-card via-card/50"
                        bottomShadow
                        className="h-50 overflow-hidden px-6"
                    >
                        <div className="space-y-2">
                            {Object.entries(container?.labels ?? {}).map(([key, value], idx) => {
                                const label = { key, value };
                                const { isEdited, isDeleted, editedLabel } =
                                    getLabelChangeStatus(label);
                                const displayLabel = editedLabel || label;

                                return (
                                    <LabelItem
                                        key={idx}
                                        label={label}
                                        isEdited={isEdited}
                                        isDeleted={isDeleted}
                                        displayLabel={displayLabel}
                                        onEdit={isSwarmContainer ? undefined : handleOpenDialog.bind(null, 'edit')}
                                        onCancelDelete={isSwarmContainer ? undefined : () => onLabelChange({ typeAction: 'add', key: label.key, value: label.value, currentKey: label.key })}
                                    />
                                );
                            })}

                            {addedLabels.map(({ key, value }, idx) => (
                                <LabelItem
                                    key={`new-${idx}`}
                                    label={{ key: key!, value: value! }}
                                    isEdited={false}
                                    isDeleted={false}
                                    isNew
                                    displayLabel={{ key: key!, value: value! }}
                                    onEdit={isSwarmContainer ? undefined : handleOpenDialog.bind(null, 'edit')}
                                />
                            ))}
                        </div>
                    </ScrollAreaWithShadow>
                )}
            </CardContent>
        </Card>
    );
}
