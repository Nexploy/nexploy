'use client';

import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';

interface NotificationSwitchProps {
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (enabled: boolean) => void;
}

export function NotificationSwitch({
    label,
    description,
    checked,
    onCheckedChange,
}: NotificationSwitchProps) {
    return (
        <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-base">{label}</span>
                <span className="text-muted-foreground text-sm">{description}</span>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </Label>
    );
}
