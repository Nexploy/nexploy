import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Shield } from 'lucide-react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardSecurity() {
    const container = useContainerStore((state) => state.container);

    if (!container) {
        return <Skeleton className={'h-100 flex-1'} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Shield className="text-primary size-4" />
                    </div>
                    <CardTitle>Sécurité</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {container.appArmorProfile && (
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">AppArmor Profile</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.appArmorProfile}
                            </code>
                        </div>
                    )}
                    {container.mountLabel && (
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground text-sm">Mount Label</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.mountLabel}
                            </code>
                        </div>
                    )}
                    {container.processLabel && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Process Label</span>
                            <code className="bg-muted/50 rounded-md px-2 py-1 text-xs">
                                {container.processLabel}
                            </code>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
