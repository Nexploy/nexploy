import drino, { HttpContextToken } from 'drino';
import { getTokenStorage } from '@/lib/storage/token-storage';

export const drinoDocker = drino.create({
    baseUrl: 'http://localhost:3300/api',
});

export const drinoGitlab = drino.create({
    baseUrl: 'https://gitlab.com/api',
    interceptors: {
        beforeConsume: ({ req }) => {
            const token = getTokenStorage();

            console.log(token);

            req.headers.set('Authorization', `Bearer ${token.accessToken}`);
        },
    },
});

export const ACCESS_TOKEN_GITLAB = new HttpContextToken(() => '');
