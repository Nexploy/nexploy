import drino from 'drino';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export const drinoGithub = drino.create({
    baseUrl: 'https://api.github.com',
    interceptors: {
        beforeConsume: ({ req }) => {
            const token = getTokenGitStorage();

            req.headers.set('Authorization', `Bearer ${token.accessToken}`);
        },
    },
});
