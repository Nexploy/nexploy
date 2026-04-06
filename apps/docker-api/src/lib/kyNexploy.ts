import ky from 'ky';

export const kyNexploy = ky.create({
    prefixUrl: `${process.env.NEXPLOY_API_URL}/api`,
    timeout: 10000,
    hooks: {
        beforeRequest: [
            (request) => {
                const apiKey = process.env.NEXPLOY_API_KEY;
                if (apiKey) {
                    request.headers.set('x-api-key', apiKey);
                }
            },
        ],
    },
});
