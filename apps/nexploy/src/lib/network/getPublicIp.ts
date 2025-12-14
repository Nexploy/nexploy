export async function getPublicIp(): Promise<string | null> {
    const services = ['https://icanhazip.com', 'https://ifconfig.me/ip'];

    for (const service of services) {
        try {
            const response = await fetch(service, {
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                return (await response.text()).trim();
            }
        } catch (error) {
            console.warn(`Error ${service}:`, error);
        }
    }

    return null;
}
