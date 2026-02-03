export const statusMap = {
    connecting: {
        labelKey: 'connecting',
        status: 'maintenance' as const,
        text: 'text-maintenance',
    },
    connected: { labelKey: 'connected', status: 'online' as const, text: 'text-online' },
    error: { labelKey: 'error', status: 'degraded' as const, text: 'text-degraded' },
    disconnected: {
        labelKey: 'disconnected',
        status: 'offline' as const,
        text: 'text-offline',
    },
};
