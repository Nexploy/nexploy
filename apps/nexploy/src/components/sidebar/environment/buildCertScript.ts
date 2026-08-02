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

DAEMON_TLS='{
  "tls": true,
  "tlsverify": true,
  "tlscacert": "/etc/docker/ca.pem",
  "tlscert": "/etc/docker/server-cert.pem",
  "tlskey": "/etc/docker/server-key.pem"
}'

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to safely update daemon.json, installing it ..."
  if command -v apt-get >/dev/null 2>&1; then
    $SUDO apt-get update -qq >/dev/null 2>&1 && $SUDO apt-get install -y -qq jq >/dev/null 2>&1
  elif command -v dnf >/dev/null 2>&1; then
    $SUDO dnf install -y -q jq >/dev/null 2>&1
  elif command -v yum >/dev/null 2>&1; then
    $SUDO yum install -y -q jq >/dev/null 2>&1
  elif command -v apk >/dev/null 2>&1; then
    $SUDO apk add --no-cache jq >/dev/null 2>&1
  elif command -v pacman >/dev/null 2>&1; then
    $SUDO pacman -Sy --noconfirm jq >/dev/null 2>&1
  elif command -v zypper >/dev/null 2>&1; then
    $SUDO zypper -q install -y jq >/dev/null 2>&1
  fi
fi

if [ -f "$DAEMON_JSON" ]; then
  $SUDO cp -p "$DAEMON_JSON" "$DAEMON_JSON.bak.$(date +%s)"
  echo "Existing daemon.json backed up."
fi

if command -v jq >/dev/null 2>&1; then
  CURRENT_JSON="{}"
  if [ -s "$DAEMON_JSON" ]; then
    if ! CURRENT_JSON="$($SUDO cat "$DAEMON_JSON")" || ! echo "$CURRENT_JSON" | jq empty >/dev/null 2>&1; then
      echo "ERROR: $DAEMON_JSON exists but is not valid JSON. Aborting to avoid destroying your configuration."
      echo "       Fix it manually, then re-run this script."
      exit 1
    fi
  fi

  TMP_JSON="$(mktemp)"
  # Merge the TLS keys into the existing config and append the tcp host
  # without dropping any host already configured
  printf '%s\\n%s\\n' "$CURRENT_JSON" "$DAEMON_TLS" | jq -s '
    .[0] as $current
    | ($current * .[1])
    | .hosts = ((($current.hosts) // ["unix:///var/run/docker.sock"])
        + ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"] | unique)
  ' > "$TMP_JSON"

  if [ ! -s "$TMP_JSON" ]; then
    echo "ERROR: failed to merge the TLS settings into $DAEMON_JSON. Nothing was changed."
    rm -f "$TMP_JSON"
    exit 1
  fi

  $SUDO cp "$TMP_JSON" "$DAEMON_JSON"
  rm -f "$TMP_JSON"
  echo "TLS settings merged into $DAEMON_JSON (existing keys preserved)."
elif [ -s "$DAEMON_JSON" ]; then
  echo "ERROR: jq is not available and $DAEMON_JSON already exists."
  echo "       Refusing to overwrite it. Install jq and re-run this script, or add these keys manually:"
  echo "$DAEMON_TLS"
  echo '       plus "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"]'
  exit 1
else
  # No existing config at all -> write a fresh daemon.json
  $SUDO tee "$DAEMON_JSON" >/dev/null <<'EOF'
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"],
  "tls": true,
  "tlsverify": true,
  "tlscacert": "/etc/docker/ca.pem",
  "tlscert": "/etc/docker/server-cert.pem",
  "tlskey": "/etc/docker/server-key.pem"
}
EOF
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
