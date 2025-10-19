import { Badge } from '@workspace/ui/components/badge';
import { useContainerStore } from '@/stores/useContainerStore';
import { StackGroup } from '@/components/docker/StackGroup';

export function ContainersStack() {
    const stacksMap = useContainerStore((state) => state.getOrganizedContainers);
    const stacks = Array.from(stacksMap().stacks.entries());

    return (
        <div className="space-y-2 px-6">
            <div className="flex items-center gap-2 px-1">
                <span className="text-lg font-semibold">Stacks</span>
                <Badge variant={'secondary'}>{stacks.length}</Badge>
            </div>
            <div className="space-y-3">
                {stacks.map(([stackName, stackContainers]) => (
                    <StackGroup
                        key={stackName}
                        stackName={stackName}
                        containers={stackContainers}
                    />
                ))}
            </div>
        </div>
    );
}
