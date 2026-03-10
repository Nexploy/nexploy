export const statusMap = {
    connecting: {
        labelKey: 'connecting',
        status: 'maintenance',
        text: 'text-maintenance',
    },
    connected: { labelKey: 'connected', status: 'online', text: 'text-online' },
    error: { labelKey: 'error', status: 'degraded', text: 'text-degraded' },
    disconnected: {
        labelKey: 'disconnected',
        status: 'offline',
        text: 'text-offline',
    },
};
