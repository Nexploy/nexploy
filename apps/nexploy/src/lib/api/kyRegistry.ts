import ky from 'ky';

interface RegistryCredentials {
    url: string;
    username?: string | null;
    password?: string | null;
}

export function kyRegistry({ url, username, password }: RegistryCredentials) {
    const baseUrl = url.startsWith('http') ? url : `https://${url}`;

    const basicAuth =
        username && password
            ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
            : null;

    return ky.create({
        prefixUrl: `${baseUrl}/v2`,
        cache: 'no-store',
        headers: basicAuth ? { Authorization: basicAuth } : {},
        hooks: {
            afterResponse: [
                async (request, _options, response) => {
                    if (response.status !== 401) return response;

                    const wwwAuth = response.headers.get('Www-Authenticate') ?? '';
                    const match = wwwAuth.match(/Bearer realm="([^"]+)",service="([^"]+)"/);
                    if (!match?.[1] || !match?.[2]) return response;

                    const [, realm, service] = match;
                    const tokenUrl = new URL(realm);
                    tokenUrl.searchParams.set('service', service);

                    const currentAuth = request.headers.get('Authorization');
                    const tokenHeaders: Record<string, string> = currentAuth
                        ? { Authorization: currentAuth }
                        : {};

                    const tokenRes = await fetch(tokenUrl.toString(), {
                        headers: tokenHeaders,
                        cache: 'no-store',
                    });
                    if (!tokenRes.ok) return response;

                    const { token } = (await tokenRes.json()) as { token: string };

                    const newHeaders = new Headers(request.headers);
                    newHeaders.set('Authorization', `Bearer ${token}`);
                    return fetch(new Request(request, { headers: newHeaders }));
                },
            ],
            beforeError: [
                async (error) => {
                    try {
                        const body = await error.response.json<{
                            message?: string;
                            errors?: { message: string }[];
                        }>();
                        if (body?.message) error.message = body.message;
                        else if (body?.errors?.[0]?.message) error.message = body.errors[0].message;
                    } catch {
                        /* empty */
                    }
                    return error;
                },
            ],
        },
    });
}
