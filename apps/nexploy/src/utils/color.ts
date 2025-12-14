import { LogLevel } from 'generated/client';

export const getLogLevelColorGradiant = (level: LogLevel) => {
    const gradientBase = 'bg-gradient-to-r to-transparent';

    switch (level) {
        case 'ERROR':
            return `border-red-500 ${gradientBase} from-red-500/10`;
        case 'WARN':
            return `border-yellow-500 ${gradientBase} from-yellow-500/10`;
        case 'DEBUG':
            return `border-muted-foreground/60 ${gradientBase} from-muted-foreground/6`;
        default:
            return `border-primary ${gradientBase} from-primary/10`;
    }
};

export const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
        case 'ERROR':
            return 'text-red-500';
        case 'WARN':
            return 'text-yellow-500';
        case 'DEBUG':
            return 'text-muted-foreground/60';
        default:
            return 'text-foreground';
    }
};

export const parseAnsiColors = (text: string) => {
    const ansiColorMap: Record<string, string> = {
        '30': 'text-current',
        '31': 'text-red-500',
        '32': 'text-green-500',
        '33': 'text-yellow-500',
        '34': 'text-blue-500',
        '35': 'text-purple-500',
        '36': 'text-cyan-500',
        '37': 'text-gray-300',
        '90': 'text-gray-500',
        '91': 'text-red-400',
        '92': 'text-green-400',
        '93': 'text-yellow-400',
        '94': 'text-blue-400',
        '95': 'text-purple-400',
        '96': 'text-cyan-400',
        '97': 'text-current',
    };

    const parts: Array<{ text: string; color?: string }> = [];
    let currentColor: string | undefined;
    let buffer = '';
    let i = 0;

    while (i < text.length) {
        const ansiMatch = text.slice(i).match(/^(?:\x1b)?\[(\d+)m/);

        if (ansiMatch) {
            if (buffer) {
                parts.push({ text: buffer, color: currentColor });
                buffer = '';
            }

            const code: any = ansiMatch[1];
            if (code === '0') {
                currentColor = undefined;
            } else {
                currentColor = ansiColorMap[code];
            }

            i += ansiMatch[0].length;
        } else {
            buffer += text[i];
            i++;
        }
    }

    if (buffer) {
        parts.push({ text: buffer, color: currentColor });
    }

    return parts;
};
