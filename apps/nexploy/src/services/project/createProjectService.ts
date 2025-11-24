import { ProjectCreateForm } from '@workspace/schemas-zod/project/projectCreate.schema';
import { prisma } from '../../../prisma/prisma';
import { Session } from '@/lib/auth/auth';

export async function createProjectService(
    { repo, ...restProjectCreate }: ProjectCreateForm,
    ctx: { session: Session },
) {
    try {
        const project = await prisma.project.create({
            data: {
                ...restProjectCreate,
                repositoryUrl: repo.url,
                userId: ctx.session.user.id,
            },
        });

        return project.id;
    } catch (error: unknown) {
        throw new Error('Failed to create project');
    }
}
