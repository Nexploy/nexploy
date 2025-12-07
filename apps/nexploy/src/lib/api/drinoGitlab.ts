import drino from 'drino';
import { getTokenStorage } from '@/lib/storage/token-storage';

export const drinoGitlab = drino.create({
    baseUrl: 'https://gitlab.com/api',
    interceptors: {
        beforeConsume: ({ req }) => {
            const token = getTokenStorage();
            req.headers.set('Authorization', `Bearer ${token.accessToken}`);
        },
    },
});
