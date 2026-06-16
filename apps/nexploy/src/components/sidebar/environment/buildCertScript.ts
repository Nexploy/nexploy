export const buildCertScript = (host: string) => `#!/bin/bash
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

# Run privileged commands with sudo when not already root
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
fi

# 4. Install the server certificates into /etc/docker/
echo ""
echo "Installing server certificates into /etc/docker/ ..."
$SUDO mkdir -p /etc/docker
$SUDO cp ca.pem server-cert.pem server-key.pem /etc/docker/
$SUDO chmod 0444 /etc/docker/ca.pem /etc/docker/server-cert.pem
$SUDO chmod 0400 /etc/docker/server-key.pem

# 5. Configure /etc/docker/daemon.json (enable TLS + tcp://0.0.0.0:2376)
DAEMON_JSON="/etc/docker/daemon.json"
echo "Configuring $DAEMON_JSON ..."

read -r -d '' DAEMON_TLS <<'EOF'
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"],
  "tls": true,
  "tlsverify": true,
  "tlscacert": "/etc/docker/ca.pem",
  "tlscert": "/etc/docker/server-cert.pem",
  "tlskey": "/etc/docker/server-key.pem"
}
EOF

if command -v jq >/dev/null 2>&1 && [ -s "$DAEMON_JSON" ]; then
  # Merge into the existing config, keeping any other settings intact
  TMP_JSON="$(mktemp)"
  echo "$DAEMON_TLS" | $SUDO jq -s '.[0] * .[1]' "$DAEMON_JSON" - > "$TMP_JSON"
  # Ensure the tcp host is present in the hosts array (avoid duplicates)
  jq '.hosts = ((.hosts // []) + ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"] | unique)' "$TMP_JSON" > "$TMP_JSON.2"
  $SUDO mv "$TMP_JSON.2" "$DAEMON_JSON"
  rm -f "$TMP_JSON"
else
  # No existing config (or no jq) -> write a fresh daemon.json
  if [ -f "$DAEMON_JSON" ]; then
    $SUDO cp "$DAEMON_JSON" "$DAEMON_JSON.bak.$(date +%s)"
    echo "Existing daemon.json backed up."
  fi
  echo "$DAEMON_TLS" | $SUDO tee "$DAEMON_JSON" >/dev/null
fi

# 6. If systemd uses '-H fd://', it conflicts with the 'hosts' key. Override it.
if [ -d /etc/systemd/system ]; then
  $SUDO mkdir -p /etc/systemd/system/docker.service.d
  printf '[Service]\\nExecStart=\\nExecStart=/usr/bin/dockerd\\n' | \\
    $SUDO tee /etc/systemd/system/docker.service.d/override.conf >/dev/null
  $SUDO systemctl daemon-reload 2>/dev/null || true
fi

# 7. Restart Docker to apply the new configuration
echo "Restarting Docker daemon ..."
$SUDO systemctl restart docker 2>/dev/null || $SUDO service docker restart 2>/dev/null || \\
  echo "Could not restart Docker automatically. Please restart it manually."

echo ""
echo "Done!"
echo "  -> Server certificates installed in /etc/docker/ (ca.pem, server-cert.pem, server-key.pem)"
echo "  -> /etc/docker/daemon.json now exposes tcp://0.0.0.0:2376 with TLS"
echo ""
echo "  -> Upload to Nexploy:"
echo "     Client Certificate : $OUTPUT_DIR/cert.pem"
echo "     Client Key         : $OUTPUT_DIR/key.pem"
echo "     CA Certificate     : $OUTPUT_DIR/ca.pem"
`;
