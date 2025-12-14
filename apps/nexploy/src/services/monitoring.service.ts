import os from 'os';
import { SystemMetrics } from '@workspace/typescript-interface/monitoring/system.metrics';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

let previousCpuInfo: {
    idle: number;
    total: number;
} | null = null;

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

function getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
        for (const type in cpu.times) {
            totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;

    if (previousCpuInfo) {
        const idleDifference = idle - previousCpuInfo.idle;
        const totalDifference = total - previousCpuInfo.total;
        const cpuPercent = 100 - ~~((100 * idleDifference) / totalDifference);

        previousCpuInfo = { idle, total };
        return cpuPercent;
    }

    previousCpuInfo = { idle, total };
    return 0;
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg();

    const cpuPercent = getCpuUsage();

    const disk = await getDiskStats();

    return {
        timestamp: Date.now(),

        cpuPercent,
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model || 'Unknown',
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
        hostname: os.hostname(),
    };
}
