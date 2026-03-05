import ky from 'ky';

interface RegistryAuth {
    username?: string | null;
    password?: string | null;
}

export function kyRegistry(url: string, auth?: RegistryAuth) {
    const headers: Record<string, string> = {};
    if (auth?.username) {
        headers['Authorization'] =
            `Basic ${Buffer.from(`${auth.username}:${auth.password ?? ''}`).toString('base64')}`;
    }

    return ky.create({
        prefixUrl: `https://${url}`,
        timeout: 5000,
        retry: 0,
        headers,
        fetch: async (input, init) => {
            try {
                return await fetch(input, init);
            } catch {
                let httpUrl: string;

                if (typeof input === 'string') {
                    httpUrl = input.replace(/^https:\/\//, 'http://');
                } else if (input instanceof Request) {
                    httpUrl = input.url.replace(/^https:\/\//, 'http://');
                } else {
                    throw new Error('Invalid fetch input');
                }

                return fetch(httpUrl, init);
            }
        },
        hooks: {
            beforeError: [
                (error) => {
                    if (error.response?.status === 401) {
                        error.message = 'Authentication failed';
                    }
                    return error;
                },
            ],
        },
    });
}
