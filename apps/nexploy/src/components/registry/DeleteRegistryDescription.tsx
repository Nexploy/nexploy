'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';

interface DeleteRegistryDescriptionProps {
    name: string;
    containerName: string | null;
    onRemoveContainerChange: (value: boolean) => void;
}

export function DeleteRegistryDescription({
    name,
    containerName,
    onRemoveContainerChange,
}: DeleteRegistryDescriptionProps) {
    const t = useTranslations('admin.registry');
    const [removeContainer, setRemoveContainer] = useState(false);

    const handleChange = (value: boolean) => {
        setRemoveContainer(value);
        onRemoveContainerChange(value);
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{t('deleteDescription', { name })}</p>

            {containerName && (
                <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5 pr-4">
                        <Label htmlFor="remove-registry-container">{t('deleteContainerLabel')}</Label>
                        <p className="text-muted-foreground text-xs">
                            {t('deleteContainerDescription', { container: containerName })}
                        </p>
                    </div>
                    <Switch id="remove-registry-container" checked={removeContainer} onCheckedChange={handleChange} />
                </div>
            )}
        </div>
    );
}
