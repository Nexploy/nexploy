'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { z } from 'zod';
import { prisma } from '../../../prisma/prisma';
import { addBuildJob } from '@/lib/queue';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/components/utils/toaster/toastServer';

const deploySchema = z.object({
  projectId: z.string(),
});

export const onDeployAction = authActionServer
  .inputSchema(deploySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput;
    const userId = ctx.session.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Create Deployment
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: 'QUEUED',
      },
    });

    try {
      // Add to Queue
      await addBuildJob(deployment.id);

      revalidatePath('/projects');
      revalidatePath(`/projects/${projectId}`);
      
      await setToastServer({
          type: 'success',
          message: 'Déploiement démarré avec succès',
      });

      return deployment;
    } catch (error) {
      console.error('Failed to queue build:', error);
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: { status: 'FAILED', buildLogs: 'Failed to queue build job.' }
      });
      
      await setToastServer({
          type: 'error',
          message: 'Erreur lors du démarrage du déploiement',
      });
      throw error;
    }
  });
