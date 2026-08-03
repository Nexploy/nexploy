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

export function groupContainersByStack(containers: Containers[]): {
    stacks: Map<string, Containers[]>;
    standaloneContainers: Containers[];
} {
    const stacks = new Map<string, Containers[]>();
    const standaloneContainers: Containers[] = [];

    containers.forEach((container) => {
        const stackName = container.labels?.['com.docker.compose.project'];
        if (stackName) {
            if (!stacks.has(stackName)) stacks.set(stackName, []);
            stacks.get(stackName)!.push(container);
        } else {
            standaloneContainers.push(container);
        }
    });

    return { stacks, standaloneContainers };
}

export function matchesContainerSearch(container: Containers, search: string): boolean {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const stackName = container.labels?.['com.docker.compose.project'];

    return (
        container.name.toLowerCase().includes(term) ||
        (container.image?.toLowerCase().includes(term) ?? false) ||
        (stackName?.toLowerCase().includes(term) ?? false)
    );
}

export function filterContainersBySearch(containers: Containers[], search: string): Containers[] {
    if (!search.trim()) return containers;
    return containers.filter((container) => matchesContainerSearch(container, search));
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
