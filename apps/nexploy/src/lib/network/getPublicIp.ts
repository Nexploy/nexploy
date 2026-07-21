import ky from 'ky';

export async function getPublicIp(): Promise<string | null> {
    const services = ['https://icanhazip.com', 'https://ifconfig.me/ip'];

    for (const service of services) {
        try {
            const text = await ky.get(service, { timeout: 5000 }).text();
            return text.trim();
        } catch (error) {
            console.warn(`Error ${service}:`, error);
        }
    }

    return null;
}
