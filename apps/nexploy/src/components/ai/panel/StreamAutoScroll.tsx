'use client';

import { useEffect, useRef } from 'react';
import { useMessageScroller, useMessageScrollerScrollable } from '@workspace/ui/components/message-scroller';

interface StreamAutoScrollProps {
    turnId?: string;
    isStreaming: boolean;
}

export function StreamAutoScroll({ turnId, isStreaming }: StreamAutoScrollProps) {
    const { scrollToEnd } = useMessageScroller();
    const { end } = useMessageScrollerScrollable();
    const followedTurnRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isStreaming || !turnId || !end || followedTurnRef.current === turnId) return;
        followedTurnRef.current = turnId;
        scrollToEnd({ behavior: 'auto' });
    }, [isStreaming, turnId, end, scrollToEnd]);

    return null;
}
