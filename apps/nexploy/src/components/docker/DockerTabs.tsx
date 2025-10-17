'use client';

import { ComponentProps } from 'react';
import { Box, Layers, LayoutGrid } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';


interface DockerTabsProps extends ComponentProps<typeof Tabs> {
    totalContainers: number;
    totalStacks: number;
    standaloneCount: number;
}


export function DockerTabs({
                               totalContainers,
                               totalStacks,
                               standaloneCount,
                               children,
                               ...props
                           }: DockerTabsProps) {
    const tabs = [
        {
            id: 'all',
            label: 'Tout',
            icon: LayoutGrid,
            count: totalContainers,
        },
        {
            id: 'stacks',
            label: 'Stacks',
            icon: Layers,
            count: totalStacks,
        },
        {
            id: 'containers',
            label: 'Conteneurs',
            icon: Box,
            count: standaloneCount,
        },
    ];

    return (
        <Tabs {...props}>
            <TabsList>
                {tabs.map((tab, index) => (
                    <TabsTrigger key={index} value={tab.id} className={'flex flex-1 gap-2'}>
                        <div className={'flex items-center gap-2'}>
                            <tab.icon/>
                            <span>{tab.label}</span>
                        </div>
                        <Badge className={'rounded-full'} variant={'secondary'}>{tab.count}</Badge>
                    </TabsTrigger>
                ))}
            </TabsList>
            {children}
        </Tabs>
    );
}
