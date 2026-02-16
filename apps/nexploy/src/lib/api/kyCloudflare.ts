import ky from 'ky';
import { getTokenCloudflareStorage } from '@/lib/storage/token-cloudlfare-storage';

export const kyCloudflare = ky.create({
    prefixUrl: 'https://api.cloudflare.com/client/v4',
    hooks: {
        beforeRequest: [
            (request) => {
                const token = getTokenCloudflareStorage();
                request.headers.set('Authorization', `Bearer ${token.apiToken}`);
            },
        ],
    },
});
