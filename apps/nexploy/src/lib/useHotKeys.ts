import { useEffect } from 'react';

type Options = {
    keydown?: boolean;
    keyup?: boolean;
    preventDefault?: boolean;
    capture?: boolean;
};

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

function parseHotkey(hotkey: string) {
    const parts = hotkey.toLowerCase().split('+');
    const wantsMeta = parts.includes('meta') || parts.includes('cmd');
    const wantsCtrl = parts.includes('ctrl');

    const requireMeta = isMac ? wantsMeta || wantsCtrl : wantsMeta && !wantsCtrl;
    const requireCtrl = isMac ? false : wantsCtrl || wantsMeta;

    return {
        key: parts.find((p) => !['ctrl', 'meta', 'cmd', 'shift', 'alt'].includes(p)),
        ctrl: requireCtrl,
        meta: requireMeta,
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
    };
}

export function useHotkeys(
    hotkey: string | string[],
    callback: (event: KeyboardEvent) => void,
    options: Options = {},
) {
    const { keydown = true, keyup = false, preventDefault = false, capture = false } = options;

    useEffect(() => {
        const configs = (Array.isArray(hotkey) ? hotkey : [hotkey]).map(parseHotkey);

        const handler = (e: KeyboardEvent) => {
            const raw = e.key.toLowerCase();
            const key = raw === ' ' ? 'space' : raw;
            const matches = configs.some(
                (config) =>
                    (!config.key || key === config.key) &&
                    (!config.ctrl || e.ctrlKey) &&
                    (!config.meta || e.metaKey) &&
                    (!config.shift || e.shiftKey) &&
                    (!config.alt || e.altKey),
            );

            if (!matches) return;
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
