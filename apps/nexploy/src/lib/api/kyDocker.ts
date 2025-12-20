import { cookies } from 'next/headers';
import ky, { type Options } from 'ky';
import { getCurrentEnvironmentId } from '@/lib/environmentContext';

export interface KyDockerOptions extends Options {
    environmentId?: string;
}

export const kyDocker = ky.create({
    prefixUrl: `${process.env.DOCKER_API_URL}/api`,
    hooks: {
        beforeRequest: [
            async (request, options) => {
                let environmentId = (options as KyDockerOptions).environmentId;

                if (!environmentId) {
                    environmentId = getCurrentEnvironmentId();
                }

                if (!environmentId) {
                    const cookieStore = await cookies();
                    environmentId = cookieStore.get('X-Docker-Environment')?.value;
                }

                if (environmentId) {
                    request.headers.set('X-Docker-Environment', environmentId);
                }
            },
        ],
    },
});
