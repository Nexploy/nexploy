import { env } from '../../../env';
import { cookies } from 'next/headers';
import ky, { type Options } from 'ky';
import { getCurrentEnvironmentId } from '@/lib/environmentContext';

// export const drinoDocker = drino.create({
//     baseUrl: `${env.DOCKER_API_URL}/api`,
//     interceptors: {
//         beforeConsume: async ({ req }) => {
//             const cookieStore = await cookies();
//             const environmentId = cookieStore.get('X-Docker-Environment')?.value;
//
//             if (environmentId) req.headers.set('X-Docker-Environment', environmentId);
//         },
//     },
// });

// Extended options to include environmentId
export interface KyDockerOptions extends Options {
    environmentId?: string;
}

export const kyDocker = ky.create({
    prefixUrl: `${env.DOCKER_API_URL}/api`,
    hooks: {
        beforeRequest: [
            async (request, options) => {
                // First try to get environmentId from options
                let environmentId = (options as KyDockerOptions).environmentId;

                // Then try AsyncLocalStorage (for Inngest context)
                if (!environmentId) {
                    environmentId = getCurrentEnvironmentId();
                }

                // Finally fall back to cookies (for HTTP requests from browser)
                if (!environmentId) {
                    const cookieStore = await cookies();
                    environmentId = cookieStore.get('X-Docker-Environment')?.value;
                }

                console.log('environmentId:', environmentId, request.url);

                if (environmentId) {
                    request.headers.set('X-Docker-Environment', environmentId);
                }
            },
        ],
    },
});
