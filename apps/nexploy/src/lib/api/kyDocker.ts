import { env } from '../../../env';
import { cookies } from 'next/headers';
import ky from 'ky';

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

export const kyDocker = ky.create({
    prefixUrl: `${env.DOCKER_API_URL}/api`,
    hooks: {
        beforeRequest: [
            async (request) => {
                const cookieStore = await cookies();
                const environmentId = cookieStore.get('X-Docker-Environment')?.value;

                if (environmentId) {
                    request.headers.set('X-Docker-Environment', environmentId);
                }
            },
        ],
    },
});
