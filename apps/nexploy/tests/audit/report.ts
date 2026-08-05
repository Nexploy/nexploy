import { collectEndpoints } from './inventory';
import { GUARD_EXEMPTIONS } from './exemptions';

const filter = process.argv[2] ?? '';
const endpoints = collectEndpoints().filter((endpoint) => endpoint.id.includes(filter));

for (const endpoint of endpoints) {
    const guards = endpoint.guards
        .map((guard) => `${guard.resource}.${guard.action}${guard.orgResolver ? `(${guard.orgResolver})` : ''}`)
        .join(', ');

    const exemption = GUARD_EXEMPTIONS[endpoint.id];
    const description = guards || (exemption ? `exempt:${exemption.category}` : 'UNGUARDED');

    console.log(`${endpoint.id}\t${description}`);
}

console.log(`\n${endpoints.length} endpoints`);
