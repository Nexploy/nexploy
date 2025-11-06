// app/api/ws/route.ts
import { NextRequest } from 'next/server';
import WebSocket from 'ws'; // Pour créer la connexion cible Docker

// Export GET pour satisfaire Next.js (route doit avoir au moins une méthode HTTP)
// Forcer une réponse d'upgrade si ce n'est pas une requête WS (comme dans la lib)
export function GET() {
    const headers = new Headers();
    headers.set('Connection', 'Upgrade');
    headers.set('Upgrade', 'websocket');
    return new Response('Upgrade Required', { status: 426, headers });
}

// Export UPGRADE async (comme dans l'exemple de la lib pour contourner l'erreur read-only)
export async function UPGRADE(
    client: import('ws').WebSocket,
    server: import('ws').WebSocketServer,
    _request: NextRequest,
    context: import('next-ws/server').RouteContext<'/api/ws'>,
) {
    console.log('azezaez');
    // Extraction directe de containerId
    const containerId = _request.nextUrl.searchParams.get('containerId');

    if (!containerId) {
        client.close(1008, 'Missing containerId parameter');
        return;
    }

    const dockerWsUrl = `ws://localhost:3300/ws/docker/exec/${containerId}`;
    const targetWs = new WebSocket(dockerWsUrl);

    targetWs.on('open', () => {
        console.log(`Proxy WebSocket opened for container ${containerId}`);

        client.on('message', (data) => {
            if (targetWs.readyState === WebSocket.OPEN) targetWs.send(data);
        });

        targetWs.on('message', (data) => {
            if (client.readyState === WebSocket.OPEN) client.send(data);
        });

        client.once('close', () => targetWs.close());
        targetWs.once('close', () => client.close());
    });

    targetWs.on('error', (error) => {
        console.error('Target WS (Docker) error:', error);
        client.close(1011, 'Internal server error');
    });

    client.on('error', (error) => {
        console.error('Client WS error:', error);
        targetWs.close();
    });
}
