import { Badge } from '@workspace/ui/components/badge';
import { StackGroup } from '@/components/docker/containers/StackGroup';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@workspace/ui/components/empty';

function IconFolderCode() {
    return null;
}

export function ContainersStack() {
    const stacksMap = useContainersStore((state) => state.getOrganizedContainers)().stacks;
    const stacks = Array.from(stacksMap.entries());

    return (
        <div className="space-y-2 px-5">
            <div className="flex items-center gap-2 px-1">
                <span className="text-lg font-semibold">Stacks</span>
                <Badge variant="secondary">{stacks.length}</Badge>
            </div>

            {stacks.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>No Docker Stacks</EmptyTitle>
                        <EmptyDescription>
                            No container stacks found. Deploy a Docker Compose stack to see it here.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="space-y-3">
                    {stacks.map(([stackName, stackContainers]) => (
                        <StackGroup
                            key={stackName}
                            stackName={stackName}
                            containers={stackContainers}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
