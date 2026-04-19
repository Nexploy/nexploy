import { cookies, headers } from 'next/headers';
import ky, { type Options } from 'ky';

export interface KyDockerOptions extends Options {
    environmentId?: string;
}

const DOCKER_API_KEY = process.env.DOCKER_API_KEY;

export const kyDocker = ky.create({
    prefixUrl: `${process.env.DOCKER_API_URL}/api`,
    timeout: 10000,
    hooks: {
        beforeError: [
            async (error) => {
                try {
                    const body = await error.response.json<{ message: string }>();
                    if (body?.message) {
                        error.message = body.message;
                    }
                } catch {
                    /* empty */
                }
                return error;
            },
        ],
        beforeRequest: [
            async (request, options) => {
                let environmentId = (options as KyDockerOptions).environmentId;

                if (!environmentId) {
                    try {
                        const cookieStore = await cookies();
                        environmentId = cookieStore.get('X-Docker-Environment')?.value;
                    } catch {
                        /* empty */
                    }
                }

                if (environmentId) {
                    request.headers.set('X-Docker-Environment', environmentId);
                }

                if (DOCKER_API_KEY) {
                    request.headers.set('Authorization', `Bearer ${DOCKER_API_KEY}`);
                }

                try {
                    const headerStore = await headers();
                    const acceptLanguage = headerStore.get('Accept-Language');
                    if (acceptLanguage) {
                        request.headers.set('Accept-Language', acceptLanguage);
                    }
                } catch {
                    /* empty */
                }
            },
        ],
    },
});
