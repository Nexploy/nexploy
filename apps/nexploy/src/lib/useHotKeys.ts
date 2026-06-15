import { type RefObject, useEffect } from 'react';

type Options = {
    keydown?: boolean;
    keyup?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    capture?: boolean;
    ref?: RefObject<HTMLElement | null>;
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
    const {
        keydown = true,
        keyup = false,
        preventDefault = false,
        stopPropagation = false,
        capture = false,
        ref,
    } = options;

    useEffect(() => {
        const configs = (Array.isArray(hotkey) ? hotkey : [hotkey]).map(parseHotkey);
        const target: HTMLElement | Document = ref?.current ?? document;

        const handler = (e: Event) => {
            const event = e as KeyboardEvent;

            if (!event.key) return;
            const raw = event.key.toLowerCase();
            const key = raw === ' ' ? 'space' : raw;

            const matches = configs.some(
                (config) =>
                    (!config.key || key === config.key) &&
                    config.ctrl === event.ctrlKey &&
                    config.meta === event.metaKey &&
                    config.shift === event.shiftKey &&
                    config.alt === event.altKey,
            );

            if (!matches) return;
            if (preventDefault) event.preventDefault();
            if (stopPropagation) event.stopPropagation();
            callback(event);
        };

        if (keydown) target.addEventListener('keydown', handler, { capture });
        if (keyup) target.addEventListener('keyup', handler, { capture });

        return () => {
            if (keydown) target.removeEventListener('keydown', handler, { capture });
            if (keyup) target.removeEventListener('keyup', handler, { capture });
        };
    }, [hotkey, callback, keydown, keyup, preventDefault, stopPropagation, capture, ref]);
}
