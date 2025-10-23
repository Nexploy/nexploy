import { z } from 'zod';

export const ImagePullSchema = z.object({
    imageName: z.string().min(1, "Le nom de l'image est requis"),
});
