import { NextResponse } from 'next/server';
import { HTTPError } from 'ky';
import { auditRoute, authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { kyDocker } from '@/lib/api/kyDocker';
import { volumeImportSchema } from '@workspace/schemas-zod/docker/volume/volumeBackup.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const POST = route
    .use(auditRoute('volume.import'))
    .use(authRouteServer)
    .use(requirePermission('backup', 'restore'))
    .use(requirePermission('volume', 'manage'))
    .handler(async (_, context) => {
        const formData = (context as { body?: Record<string, unknown> }).body ?? {};
        const file = formData.file;

        const parsed = volumeImportSchema.safeParse({
            volumeName: formData.volumeName,
            overwrite: formData.overwrite === 'true',
        });

        if (!parsed.success) {
            return NextResponse.json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
        }

        if (!(file instanceof File) || file.size === 0) {
            const t = await getErrorTranslator();
            return NextResponse.json({ message: t('api.volumeImportFileRequired') }, { status: 400 });
        }

        const { volumeName, overwrite } = parsed.data;

        try {
            const result = await kyDocker
                .post(`backups/restore/${encodeURIComponent(volumeName)}?overwrite=${overwrite}`, {
                    body: await file.arrayBuffer(),
                    headers: { 'Content-Type': 'application/octet-stream' },
                    timeout: false,
                })
                .json();

            return NextResponse.json(result);
        } catch (err: unknown) {
            const status = err instanceof HTTPError ? err.response.status : 500;
            const message = err instanceof Error ? err.message : 'Volume import failed';
            return NextResponse.json({ message }, { status });
        }
    });
