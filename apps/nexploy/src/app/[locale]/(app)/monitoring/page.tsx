import type { Metadata } from 'next';
import { MonitoringPage } from '@/components/monitoring/MonitoringPage';

export const metadata: Metadata = {
    title: 'Monitoring',
    description: 'Monitor host resources and every Docker container in real time.',
};

export default function Monitoring() {
    return <MonitoringPage />;
}
