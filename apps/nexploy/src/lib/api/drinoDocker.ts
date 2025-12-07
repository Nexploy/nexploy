import drino from 'drino';
import { env } from '../../../env';

export const drinoDocker = drino.create({
    baseUrl: `${env.DOCKER_API_URL}/api`,
});
