import drino from 'drino';
import { getTokenStorage } from '@/lib/storage/token-storage';
import ky from 'ky';

export const drinoGitlab = drino.create({
    baseUrl: 'https://gitlab.com/api',
    interceptors: {
        beforeConsume: ({ req }) => {
            const token = getTokenStorage();
            req.headers.set('Authorization', `Bearer ${token.accessToken}`);
        },
    },
});

export const kyGitlab = ky.create({
    prefixUrl: 'https://gitlab.com/api',
    hooks: {
        beforeRequest: [
            (request) => {
                const token = getTokenStorage();
                request.headers.set('Authorization', `Bearer ${token.accessToken}`);
            },
        ],
    },
});
