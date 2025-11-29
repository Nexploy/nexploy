import { EventSchemas, Inngest } from 'inngest';
import { realtimeMiddleware } from '@inngest/realtime/middleware';
import { BuildConfig } from '@workspace/typescript-interface/inngest/build';

type Events = {
    'build/start': {
        data: {
            buildId: string;
            config: BuildConfig;
        };
    };
};

export const inngest = new Inngest({
    id: 'nextploy',
    schemas: new EventSchemas().fromRecord<Events>(),
    isDev: process.env.NODE_ENV !== 'production',
    middleware: [realtimeMiddleware()],
});
