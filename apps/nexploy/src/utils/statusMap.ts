export const statusMap = {
    connecting: {
        label: 'Connecting...',
        status: 'maintenance' as const,
        text: 'text-maintenance',
    },
    connected: { label: 'Connected', status: 'online' as const, text: 'text-online' },
    error: { label: 'Error', status: 'degraded' as const, text: 'text-degraded' },
    disconnected: {
        label: 'Disconnected',
        status: 'offline' as const,
        text: 'text-offline',
    },
};
