import ky from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export const kyGithub = ky.create({
    prefixUrl: 'https://api.github.com',
    hooks: {
        beforeRequest: [
            (request) => {
                const token = getTokenGitStorage();
                request.headers.set('Authorization', `Bearer ${token.accessToken}`);
            },
        ],
    },
});
