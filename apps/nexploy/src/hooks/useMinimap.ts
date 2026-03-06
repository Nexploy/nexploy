import { useCallback, useRef, useState } from 'react';

export function useMinimap() {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onMoveStart = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(true);
    }, []);

    const onMoveEnd = useCallback(() => {
        timerRef.current = setTimeout(() => setVisible(false), 1200);
    }, []);

    return { minimapVisible: visible, onMoveStart, onMoveEnd };
}
