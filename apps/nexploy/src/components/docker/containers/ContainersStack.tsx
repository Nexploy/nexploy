import { Badge } from '@workspace/ui/components/badge';
import { StackGroup } from '@/components/docker/containers/StackGroup';
import { useContainersStore } from '@/stores/docker/useContainersStore';

export function ContainersStack() {
    const stacksMap = useContainersStore((state) => state.getOrganizedContainers)().stacks;
    const stacks = Array.from(stacksMap.entries());

    return (
        <div className="space-y-2 px-5">
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
