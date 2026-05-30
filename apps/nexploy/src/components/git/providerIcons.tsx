import Github from '@thesvg/react/github';
import Gitlab from '@thesvg/react/gitlab';

export const providerIcons: Record<'github' | 'gitlab', React.ReactNode> = {
    github: <Github className="size-6" />,
    gitlab: <Gitlab className="size-5" />,
};
