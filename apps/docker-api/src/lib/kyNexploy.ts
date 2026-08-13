import ky from 'ky';
import { getNexployApiKey } from '@/lib/apiKey';

export const kyNexploy = ky.create({
    prefixUrl: `${process.env.NEXPLOY_API_URL}/api`,
    timeout: 10000,
    hooks: {
        beforeRequest: [
            async (request) => {
                const apiKey = await getNexployApiKey();
                if (apiKey) {
                    request.headers.set('x-api-key', apiKey);
                }
            },
        ],
    },
});
