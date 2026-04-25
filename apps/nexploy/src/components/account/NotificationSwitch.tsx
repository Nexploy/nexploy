'use client';

import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface NotificationSwitchProps {
    label: string;
    description: string;
}

export function NotificationSwitch({ label, description }: NotificationSwitchProps) {
    const { showContainerToast, setShowContainerToast } = useNotificationStore();

    return (
        <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-base">{label}</span>
                <span className="text-muted-foreground text-sm">{description}</span>
            </div>
            <Switch
                id="notifications"
                checked={showContainerToast}
                onCheckedChange={setShowContainerToast}
            />
        </Label>
    );
}
