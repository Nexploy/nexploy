'use client';

import { Button } from '@workspace/ui/components/button';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

const buildCertScript = (host: string) => `#!/bin/bash
# TLS Certificate Generator for Docker - Nexploy

HOST="${host}"
DAYS=3650
OUTPUT_DIR="./docker-certs"

mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

echo "Generating TLS certificates for Docker host: $HOST"

# 1. CA (Certificate Authority)
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -days $DAYS -key ca-key.pem -sha256 -out ca.pem \\
  -subj "/CN=docker-ca"

# 2. Server certificate (install on the Docker server)
openssl genrsa -out server-key.pem 4096
openssl req -subj "/CN=$HOST" -sha256 -new -key server-key.pem -out server.csr
echo "subjectAltName = IP:$HOST,IP:127.0.0.1" > extfile.cnf
echo "extendedKeyUsage = serverAuth" >> extfile.cnf
openssl x509 -req -days $DAYS -sha256 -in server.csr \\
  -CA ca.pem -CAkey ca-key.pem -CAcreateserial \\
  -out server-cert.pem -extfile extfile.cnf

# 3. Client certificate (upload in Nexploy)
openssl genrsa -out key.pem 4096
openssl req -subj "/CN=client" -new -key key.pem -out client.csr
echo "extendedKeyUsage = clientAuth" > extfile-client.cnf
openssl x509 -req -days $DAYS -sha256 -in client.csr \\
  -CA ca.pem -CAkey ca-key.pem -CAcreateserial \\
  -out cert.pem -extfile extfile-client.cnf

# Cleanup
rm -f *.csr *.cnf *.srl

echo ""
echo "Done! Files generated in $OUTPUT_DIR:"
echo "  -> Upload to Nexploy:"
echo "     Client Certificate : cert.pem"
echo "     Client Key         : key.pem"
echo "     CA Certificate     : ca.pem"
echo ""
echo "  -> Copy to Docker server (/etc/docker/):"
echo "     ca.pem, server-cert.pem, server-key.pem"
echo ""
echo "  -> Add to /etc/docker/daemon.json on the server:"
echo '     {'
echo '       "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"]'
echo '       "tls": true,'
echo '       "tlscacert": "/etc/docker/ca.pem",'
echo '       "tlscert": "/etc/docker/server-cert.pem",'
echo '       "tlskey": "/etc/docker/server-key.pem",'
echo '     }'
`;

interface DownloadCertScriptButtonProps {
    disabled?: boolean;
    host?: string;
}

export function DownloadCertScriptButton({ disabled, host }: DownloadCertScriptButtonProps) {
    const t = useTranslations('docker.environmentForm');

    const handleDownload = () => {
        if (!host) return;

        const script = buildCertScript(host);
        const blob = new Blob([script], { type: 'text/x-sh' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generate-docker-certs-${host}.sh`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={disabled}
            className="h-7 gap-1.5 text-xs"
        >
            <Download className="h-3.5 w-3.5" />
            {t('downloadCertScript')}
        </Button>
    );
}
