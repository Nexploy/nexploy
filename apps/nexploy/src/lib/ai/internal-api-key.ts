// Stable key for internal server-to-server calls (chat route → MCP route).
// Uses NEXPLOY_API_KEY if set, otherwise generates one per process so both
// routes always agree on the same value within the same Next.js worker.
export const INTERNAL_API_KEY = process.env.NEXPLOY_API_KEY ?? crypto.randomUUID();
