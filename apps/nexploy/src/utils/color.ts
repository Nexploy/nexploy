import type { CSSProperties } from 'react';
import Anser from 'anser';
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

const ansiForegroundClasses: Record<string, string> = {
    'ansi-black': 'text-neutral-600',
    'ansi-red': 'text-red-500',
    'ansi-green': 'text-green-500',
    'ansi-yellow': 'text-yellow-500',
    'ansi-blue': 'text-blue-500',
    'ansi-magenta': 'text-purple-500',
    'ansi-cyan': 'text-cyan-500',
    'ansi-white': 'text-gray-300',
    'ansi-bright-black': 'text-gray-500',
    'ansi-bright-red': 'text-red-400',
    'ansi-bright-green': 'text-green-400',
    'ansi-bright-yellow': 'text-yellow-400',
    'ansi-bright-blue': 'text-blue-400',
    'ansi-bright-magenta': 'text-purple-400',
    'ansi-bright-cyan': 'text-cyan-400',
    'ansi-bright-white': 'text-current',
};

const ansiBackgroundClasses: Record<string, string> = {
    'ansi-black': 'bg-neutral-800',
    'ansi-red': 'bg-red-500/30',
    'ansi-green': 'bg-green-500/30',
    'ansi-yellow': 'bg-yellow-500/30',
    'ansi-blue': 'bg-blue-500/30',
    'ansi-magenta': 'bg-purple-500/30',
    'ansi-cyan': 'bg-cyan-500/30',
    'ansi-white': 'bg-gray-300/30',
    'ansi-bright-black': 'bg-gray-600/40',
    'ansi-bright-red': 'bg-red-400/30',
    'ansi-bright-green': 'bg-green-400/30',
    'ansi-bright-yellow': 'bg-yellow-400/30',
    'ansi-bright-blue': 'bg-blue-400/30',
    'ansi-bright-magenta': 'bg-purple-400/30',
    'ansi-bright-cyan': 'bg-cyan-400/30',
    'ansi-bright-white': 'bg-gray-200/30',
};

const ansiDecorationClasses: Record<string, string> = {
    bold: 'font-bold',
    dim: 'opacity-60',
    italic: 'italic',
    underline: 'underline',
    blink: 'animate-pulse',
    hidden: 'invisible',
    strikethrough: 'line-through',
};

const xtermPaletteBase = [
    '#000000',
    '#cd0000',
    '#00cd00',
    '#cdcd00',
    '#0000ee',
    '#cd00cd',
    '#00cdcd',
    '#e5e5e5',
    '#7f7f7f',
    '#ff0000',
    '#00ff00',
    '#ffff00',
    '#5c5cff',
    '#ff00ff',
    '#00ffff',
    '#ffffff',
];

const paletteIndexToHex = (index: number) => {
    if (index < 16) return xtermPaletteBase[index];

    if (index < 232) {
        const levels = [0, 95, 135, 175, 215, 255];
        const offset = index - 16;
        const red = levels[Math.floor(offset / 36) % 6] as number;
        const green = levels[Math.floor(offset / 6) % 6] as number;
        const blue = levels[offset % 6] as number;
        return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    }

    const gray = 8 + (index - 232) * 10;
    return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
};

const resolveAnsiColor = (token: string | null, truecolor: string | null) => {
    if (!token) return null;
    if (token === 'ansi-truecolor') return truecolor ? `rgb(${truecolor})` : null;

    const paletteMatch = token.match(/^ansi-palette-(\d+)$/);
    if (paletteMatch) return paletteIndexToHex(Number(paletteMatch[1]));

    return null;
};

export interface AnsiPart {
    text: string;
    color?: string;
    style?: CSSProperties;
}

type AnsiChunk = ReturnType<typeof Anser.ansiToJson>[number] & { isInverted?: boolean };

export const parseAnsiColors = (text: string): AnsiPart[] => {
    const chunks = Anser.ansiToJson(text, { use_classes: true, remove_empty: true, json: true }) as AnsiChunk[];

    return chunks.map((chunk) => {
        const foregroundToken = chunk.isInverted ? chunk.bg : chunk.fg;
        const backgroundToken = chunk.isInverted ? chunk.fg : chunk.bg;
        const foregroundTruecolor = chunk.isInverted ? chunk.bg_truecolor : chunk.fg_truecolor;
        const backgroundTruecolor = chunk.isInverted ? chunk.fg_truecolor : chunk.bg_truecolor;

        const classNames: string[] = [];

        if (foregroundToken && ansiForegroundClasses[foregroundToken]) {
            classNames.push(ansiForegroundClasses[foregroundToken] as string);
        }
        if (backgroundToken && ansiBackgroundClasses[backgroundToken]) {
            classNames.push(ansiBackgroundClasses[backgroundToken] as string);
        }
        for (const decoration of chunk.decorations) {
            const decorationClass = ansiDecorationClasses[decoration];
            if (decorationClass) classNames.push(decorationClass);
        }

        const style: CSSProperties = {};
        const resolvedForeground = resolveAnsiColor(foregroundToken, foregroundTruecolor);
        const resolvedBackground = resolveAnsiColor(backgroundToken, backgroundTruecolor);
        if (resolvedForeground) style.color = resolvedForeground;
        if (resolvedBackground) style.backgroundColor = resolvedBackground;

        return {
            text: chunk.content,
            ...(classNames.length > 0 && { color: classNames.join(' ') }),
            ...(Object.keys(style).length > 0 && { style }),
        };
    });
};
