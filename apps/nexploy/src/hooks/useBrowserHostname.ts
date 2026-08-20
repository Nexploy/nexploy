import { useEffect, useState } from 'react';

export function useBrowserHostname() {
    const [hostname, setHostname] = useState<string | null>(null);

    useEffect(() => {
        setHostname(window.location.hostname);
    }, []);

    return hostname;
}
