import drino from 'drino';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';
import ky from 'ky';

export const drinoGitlab = drino.create({
    baseUrl: 'https://gitlab.com/api',
    interceptors: {
        beforeConsume: ({ req }) => {
            const token = getTokenGitStorage();
            req.headers.set('Authorization', `Bearer ${token.accessToken}`);
        },
    },
});

export const kyGitlab = ky.create({
    prefixUrl: 'https://gitlab.com/api',
    hooks: {
        beforeRequest: [
            (request) => {
                const token = getTokenGitStorage();
                request.headers.set('Authorization', `Bearer ${token.accessToken}`);
            },
        ],
    },
});
