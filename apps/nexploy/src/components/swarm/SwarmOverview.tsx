'use client';

import { SwarmStatsCards } from './SwarmStatsCards';
import { JoinTokenCards } from './JoinTokenCards';

export function SwarmOverview() {
    return (
        <div className="space-y-6">
            <SwarmStatsCards />
            <JoinTokenCards />
        </div>
    );
}
