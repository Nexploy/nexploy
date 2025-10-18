'use client'

import { useContainerState } from '@/hooks/useContainerState';

export function ContainerDashboard() {
    const { containers, isConnected, error, lastUpdate, getContainersByState } =
        useContainerState('http://localhost:3300')

    const running = getContainersByState('running')
    const stopped = getContainersByState('stopped')
    const paused = getContainersByState('paused')

    return (
        <div className="p-4">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Container Dashboard</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}/>
                    <span className="text-sm">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    {lastUpdate > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                            Last update: {new Date(lastUpdate).toLocaleTimeString()}
                        </span>
                    )}
                </div>
                {error && (
                    <div className="mt-2 text-sm text-red-600">
                        {error.message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-100 p-4 rounded">
                    <div className="text-2xl font-bold">{running.length}</div>
                    <div className="text-sm">Running</div>
                </div>
                <div className="bg-red-100 p-4 rounded">
                    <div className="text-2xl font-bold">{stopped.length}</div>
                    <div className="text-sm">Stopped</div>
                </div>
            </div>
        </div>
    )
}
