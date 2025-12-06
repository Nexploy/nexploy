import drino from 'drino';
import { getTokenStorage } from '@/lib/storage/token-storage';

export const drinoGithub = drino.create({
    baseUrl: 'https://api.github.com',
    interceptors: {
        beforeConsume: ({ req }) => {
            const token = getTokenStorage();

            req.headers.set('Authorization', `Bearer ${token.accessToken}`);
        },
    },
});
