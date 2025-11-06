import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Projects',
    description: 'Gérez vos projets Docker avec Nexploy',
};

export default function ProjectsPage() {
    return <div className="text-3xl font-semibold">Projects</div>;
}
