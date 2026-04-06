import ky, { Options } from 'ky';
import { getTokenGitStorage } from '@/lib/storage/token-git-storage';

export interface KyGithubOptions extends Options {
    withAuth?: boolean;
}

export const kyGithubApi = ky.create({
    prefixUrl: 'https://api.github.com',
    hooks: {
        beforeRequest: [
            (request, options) => {
                if ((options as KyGithubOptions).withAuth === false) return;
                const token = getTokenGitStorage();
                request.headers.set('Authorization', `Bearer ${token.accessToken}`);
            },
        ],
    },
});

export const kyGithubPublic = ky.create({
    prefixUrl: 'https://github.com',
    headers: {
        Accept: 'application/json',
    },
});
