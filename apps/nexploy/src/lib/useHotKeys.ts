import { useEffect } from 'react';

type Options = {
    keydown?: boolean;
    keyup?: boolean;
    preventDefault?: boolean;
    capture?: boolean;
};

function parseHotkey(hotkey: string) {
    const parts = hotkey.toLowerCase().split('+');

    return {
        key: parts.find((p) => !['ctrl', 'meta', 'shift', 'alt'].includes(p)),
        ctrl: parts.includes('ctrl'),
        meta: parts.includes('meta') || parts.includes('cmd'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
    };
}

export function useHotkeys(
    hotkey: string,
    callback: (event: KeyboardEvent) => void,
    options: Options = {},
) {
    const { keydown = true, keyup = false, preventDefault = false, capture = false } = options;

    useEffect(() => {
        const config = parseHotkey(hotkey);

        const handler = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            if (config.key && key !== config.key) return;
            if (config.ctrl && !e.ctrlKey) return;
            if (config.meta && !e.metaKey) return;
            if (config.shift && !e.shiftKey) return;
            if (config.alt && !e.altKey) return;

            if (preventDefault) e.preventDefault();

            callback(e);
        };

        if (keydown) document.addEventListener('keydown', handler, { capture });
        if (keyup) document.addEventListener('keyup', handler, { capture });

        return () => {
            if (keydown) document.removeEventListener('keydown', handler, { capture });
            if (keyup) document.removeEventListener('keyup', handler, { capture });
        };
    }, [hotkey, callback, keydown, keyup, preventDefault, capture]);
}
