import { StatusProps } from '@workspace/ui/components/kibo-ui/status';
import { BuildStatus } from 'generated/client';

export const STATUS_PIPELINE: Record<BuildStatus, StatusProps['status']> = {
    QUEUED: 'waiting',
    BUILDING: 'degraded',
    COMPLETED: 'maintenance',
    FAILED: 'offline',
    CANCELLED: 'offline',
};
