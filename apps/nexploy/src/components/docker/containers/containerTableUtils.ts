import { FilterFn } from '@tanstack/react-table';
import { Containers, ContainerTableRow } from '@workspace/typescript-interface/docker/docker.containers';

export type { ContainerTableRow };

export function buildContainerRows(containers: Containers[]): ContainerTableRow[] {
    const stackMap = new Map<string, Containers[]>();
    const standalone: Containers[] = [];

    containers.forEach((c) => {
        const stackName = c.labels?.['com.docker.compose.project'];
        if (stackName) {
            if (!stackMap.has(stackName)) stackMap.set(stackName, []);
            stackMap.get(stackName)!.push(c);
        } else {
            standalone.push(c);
        }
    });

    const rows: ContainerTableRow[] = [];

    stackMap.forEach((stackContainers, stackName) => {
        const runningCount = stackContainers.filter((c) => c.state === 'running').length;
        rows.push({
            id: `stack-${stackName}`,
            isGroup: true,
            name: stackName,
            stackName,
            runningCount,
            totalCount: stackContainers.length,
            subRows: stackContainers.map((c) => ({
                id: c.id,
                isGroup: false,
                name: c.name,
                state: c.state,
                status: c.status,
                image: c.image,
                imageId: c.imageId,
                ports: c.ports,
            })),
        });
    });

    standalone.forEach((c) => {
        rows.push({
            id: c.id,
            isGroup: false,
            name: c.name,
            state: c.state,
            status: c.status,
            image: c.image,
            imageId: c.imageId,
            ports: c.ports,
        });
    });

    return rows;
}

export const containerTableGlobalFilterFn: FilterFn<ContainerTableRow> = (row, _, value) => {
    const search = value.toLowerCase();
    if (row.original.isGroup) {
        if (row.original.stackName?.toLowerCase().includes(search)) return true;
        return row.original.subRows?.some((r) => r.name.toLowerCase().includes(search)) ?? false;
    }
    return (
        row.original.name.toLowerCase().includes(search) ||
        (row.original.image?.toLowerCase().includes(search) ?? false)
    );
};
