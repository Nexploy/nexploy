import drino from 'drino';
import { getTokenCloudflareStorage } from '@/lib/storage/token-cloudlfare-storage';

export const drinoCloudflare = drino.create({
    baseUrl: 'https://api.cloudflare.com/client/v4',
    interceptors: {
        beforeConsume: ({ req }) => {
            const token = getTokenCloudflareStorage();

            req.headers.set('Authorization', `Bearer ${token.apiToken}`);
        },
    },
});
