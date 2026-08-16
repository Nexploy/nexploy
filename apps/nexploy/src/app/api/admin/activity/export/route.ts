import { activityExportQuerySchema } from '@workspace/schemas-zod/admin/activity.schema';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { countActivityLogs, iterateActivityLogs } from '@/services/activityLog.service';
import {
    createActivityExportSerializer,
    getActivityExportContentType,
    getActivityExportFilename,
} from '@/lib/activity/activityExport';
import { anonymizeActivityEntry } from '@/lib/activity/anonymizeActivity';
import { recordActivity } from '@/lib/activity/recordActivity';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('activity', 'read'))
    .query(activityExportQuerySchema)
    .handler(async (_request, { query }) => {
        const { format, limit, ...rest } = query;
        const filters = { ...rest, to: rest.to ?? new Date() };

        const total = await countActivityLogs(filters);
        const exported = Math.min(total, limit);

        await recordActivity({
            name: 'activity.export',
            source: 'API_ROUTE',
            status: 'SUCCESS',
            input: { format, limit, exported, ...filters },
        });

        const encoder = new TextEncoder();
        const serializer = createActivityExportSerializer(format);

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(serializer.start()));

                    for await (const entry of iterateActivityLogs(filters, limit)) {
                        controller.enqueue(encoder.encode(serializer.entry(anonymizeActivityEntry(entry))));
                    }

                    controller.enqueue(encoder.encode(serializer.end()));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            status: 200,
            headers: {
                'Content-Type': getActivityExportContentType(format),
                'Content-Disposition': `attachment; filename="${getActivityExportFilename(format)}"`,
                'Cache-Control': 'no-store',
                'X-Activity-Export-Count': String(exported),
                'X-Activity-Export-Total': String(total),
            },
        });
    });
