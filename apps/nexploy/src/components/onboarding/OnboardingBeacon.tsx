'use client';

import type { BeaconRenderProps } from 'react-joyride';

export function OnboardingBeacon(_props: BeaconRenderProps) {
    return (
        <span className="relative flex size-4 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
    );
}
