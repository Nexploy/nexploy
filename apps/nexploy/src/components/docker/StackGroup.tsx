'use client';

import { useState, useTransition } from 'react';
import { ContainerInfo } from 'dockerode';
import { ContainerCard } from '@/components/docker/ContainerCard';
import { ChevronDown, ChevronRight, Layers, Play } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { useRouter } from 'next/navigation';
import { drinoDocker } from '@/lib/api/drinoDocker';

interface StackGroupProps {
    stackName: string;
    containers: ContainerInfo[];
}

export function StackGroup({ stackName, containers }: StackGroupProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const runningCount = containers.filter(c => c.State === 'running').length;
    const hasRunning = runningCount > 0;

    const handleAction = async (action: 'start' | 'stop' | 'restart') => {
        try {
            await drinoDocker.post(`/composes/${stackName}/${action}`, {}).consume();
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error(`Erreur lors de l’action ${action}:`, error);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center justify-center w-6 h-6">
                    {isExpanded ? (
                        <ChevronDown size={20} className="text-gray-600"/>
                    ) : (
                        <ChevronRight size={20} className="text-gray-600"/>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <Layers size={18} className="text-blue-600"/>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {stackName}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <div onClick={(event) => {
                        event.stopPropagation();
                        handleAction('start')
                    }}
                         className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <Play/>
                    </div>
                    {hasRunning && (
                        <Status
                            className="text-sm"
                            status={'online'}
                            variant="ghost"
                        >
                            <StatusIndicator/>
                            <StatusLabel className={'text-emerald-500'}>
                                {runningCount} actif
                            </StatusLabel>
                        </Status>
                    )}
                    <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                        {containers.length} conteneur{containers.length > 1 ? 's' : ''}
                    </span>
                </div>
            </button>

            {isExpanded && (
                <div className="p-4 pt-2 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {containers.map((container) => (
                            <ContainerCard key={container.Id} container={container}/>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
