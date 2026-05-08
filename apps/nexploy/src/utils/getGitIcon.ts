import { Link2 } from 'lucide-react';
import { SiGithub, SiGitlab } from '@icons-pack/react-simple-icons';

export const getGitIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('github')) return SiGithub;
    if (p.includes('gitlab')) return SiGitlab;
    return Link2;
};
