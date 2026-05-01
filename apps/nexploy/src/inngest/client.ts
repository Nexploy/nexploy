import { EventSchemas, Inngest } from 'inngest';
import { realtimeMiddleware } from '@inngest/realtime/middleware';
import { BuildConfig } from '@workspace/typescript-interface/repository/build';
import { BackupScheduleStartEvent } from '@workspace/typescript-interface/aws/backupSchedule';

type Events = {
    'build/start': {
        data: {
            buildId: string;
            config: BuildConfig;
        };
    };
    'build/cancel': {
        data: {
            buildId: string;
        };
    };
    'backup/schedule.start': { data: BackupScheduleStartEvent };
    'backup/schedule.cancel': {
        data: {
            id: string;
        };
    };
};

export const inngest = new Inngest({
    id: 'nextploy',
    schemas: new EventSchemas().fromRecord<Events>(),
    isDev: process.env.NODE_ENV !== 'production',
    middleware: [realtimeMiddleware()],
});
