import os from 'os';
import { SystemMetrics } from '@workspace/typescript-interface/monitoring/system.metrics';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface CpuSample {
    idle: number;
    total: number;
}

let previousCpuInfo: CpuSample | null = null;
let previousCoreSamples: CpuSample[] | null = null;

async function getDiskStats(): Promise<{ total: number; used: number; free: number }> {
    try {
        const platform = os.platform();

        if (platform === 'win32') {
            const { stdout } = await execAsync(
                'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv',
            );
            const lines = stdout
                .trim()
                .split('\n')
                .filter((line) => line.trim());
            if (lines.length < 2) throw new Error('Invalid wmic output');

            const parts = lines[1]!.split(',');
            const freeSpace = parseInt(parts[1]?.trim() || '0', 10);
            const size = parseInt(parts[2]?.trim() || '0', 10);
            return {
                total: size || 0,
                free: freeSpace || 0,
                used: (size || 0) - (freeSpace || 0),
            };
        }

        const { stdout } = await execAsync('df -k /');
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) throw new Error('Invalid df output');

        const parts = lines[1]!.split(/\s+/);
        const total = parseInt(parts[1] || '0', 10) * 1024;
        const used = parseInt(parts[2] || '0', 10) * 1024;
        const free = parseInt(parts[3] || '0', 10) * 1024;

        return { total, used, free };
    } catch (error) {
        return { total: 0, used: 0, free: 0 };
    }
}

function toCpuSample(times: os.CpuInfo['times']): CpuSample {
    let total = 0;
    for (const type in times) {
        total += times[type as keyof typeof times];
    }
    return { idle: times.idle, total };
}

function computeUsagePercent(previous: CpuSample | undefined, current: CpuSample): number {
    if (!previous) return 0;

    const totalDifference = current.total - previous.total;
    if (totalDifference <= 0) return 0;

    const idleDifference = current.idle - previous.idle;
    const percent = 100 - (100 * idleDifference) / totalDifference;

    return Math.max(0, Math.min(100, percent));
}

function getCpuUsage(): { cpuPercent: number; cpuCoresPercent: number[] } {
    const cpus = os.cpus();
    const coreSamples = cpus.map((cpu) => toCpuSample(cpu.times));

    const aggregate = coreSamples.reduce<CpuSample>(
        (acc, sample) => ({ idle: acc.idle + sample.idle, total: acc.total + sample.total }),
        { idle: 0, total: 0 },
    );

    const cpuPercent = computeUsagePercent(previousCpuInfo ?? undefined, aggregate);
    const cpuCoresPercent = coreSamples.map((sample, index) =>
        computeUsagePercent(previousCoreSamples?.[index], sample),
    );

    previousCpuInfo = aggregate;
    previousCoreSamples = coreSamples;

    return { cpuPercent, cpuCoresPercent };
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg();

    const { cpuPercent, cpuCoresPercent } = getCpuUsage();

    const disk = await getDiskStats();

    return {
        timestamp: Date.now(),

        cpuPercent,
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model || 'Unknown',
        cpuCoresPercent,
        loadAverage: loadAvg,

        memoryTotal: totalMem,
        memoryUsed: usedMem,
        memoryFree: freeMem,
        memoryPercent: (usedMem / totalMem) * 100,

        diskTotal: disk.total,
        diskUsed: disk.used,
        diskFree: disk.free,
        diskPercent: disk.total ? (disk.used / disk.total) * 100 : 0,

        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
    };
}
