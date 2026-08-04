import type Docker from 'dockerode';

export async function pullImage(docker: Docker, image: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (pullErr: Error | null) => (pullErr ? reject(pullErr) : resolve()));
        });
    });
}
