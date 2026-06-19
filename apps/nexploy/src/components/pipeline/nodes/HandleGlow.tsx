'use client';

import { CSSProperties } from 'react';
import { useNodeConnections } from '@xyflow/react';

interface HandleGlowProps {
    handleType: 'source' | 'target';
    handleId: string;
    style: CSSProperties;
}

export function HandleGlow({ handleType, handleId, style }: HandleGlowProps) {
    const connections = useNodeConnections({ handleType, handleId });
    const connected = connections.length > 0;

    const { boxShadow, ...position } = style;

    return (
        <div className="pointer-events-none absolute" style={position}>
            <div
                className="size-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                    boxShadow,
                    transformOrigin: 'center',
                    opacity: connected ? 1 : 0,
                    transform: connected ? 'scale(1)' : 'scale(0.3)',
                }}
            />
        </div>
    );
}
