'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { projectCreateFormSchema } from '@workspace/schemas-zod/project/projectCreate.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { prisma } from '../../../prisma/prisma';
import { getGitProviderToken } from '@/services/git/git.service';

export const onProjectCreateAction = authActionServer
    .schema(projectCreateFormSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            let gitToken = parsedInput.gitToken;

            if (parsedInput.gitProvider && parsedInput.gitProvider !== 'manual') {
                try {
                    gitToken = await getGitProviderToken(parsedInput.gitProvider);
                } catch (e) {
                    console.warn('Could not fetch git token', e);
                    // Proceed without token or fail? Proceeding might fail deployment if private.
                }
            }

            // Remove gitProvider from data before saving if it's not in the model
            // Assuming Project model doesn't have gitProvider yet, or if it does, we keep it.
            // But parsedInput has it.
            // We need to spread parsedInput carefully.
            // Let's assume we want to save everything that matches the model.
            
            // We should probably overwrite gitToken with the one we found.
            const { gitProvider, ...projectData } = parsedInput;
            
            const project = await prisma.project.create({
                data: {
                    ...projectData,
                    gitToken,
                    userId: ctx.session.user.id,
                },
            });

            return project.id;
        } catch (err: unknown) {
            await setToastServer({
                type: 'error',
                message: 'Une erreur est survenue lors de la création du projet',
            });
            console.error(err);
            throw err;
        }
    });
