import { StatusProps } from '@workspace/ui/components/kibo-ui/status';

export const statusMap = {
    connecting: {
        labelKey: 'connecting',
        status: 'maintenance' as StatusProps['status'],
        text: 'text-maintenance',
    },
    connected: {
        labelKey: 'connected',
        status: 'online' as StatusProps['status'],
        text: 'text-online',
    },
    error: {
        labelKey: 'error',
        status: 'degraded' as StatusProps['status'],
        text: 'text-degraded',
    },
    disconnected: {
        labelKey: 'disconnected',
        status: 'offline' as StatusProps['status'],
        text: 'text-offline',
    },
};
