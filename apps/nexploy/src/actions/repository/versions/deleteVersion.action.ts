'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteVersionSchema } from '@workspace/schemas-zod/repository/version.schema';
import { deleteVersion } from '@/services/docker/version.service';

export const onDeleteVersion = authActionServer
    .use(requirePermission('build', 'delete'))
    .inputSchema(deleteVersionSchema)
    .action(async ({ parsedInput }) => {
        const { repositoryId, imageTag } = parsedInput;
        await deleteVersion(repositoryId, imageTag);
    });
