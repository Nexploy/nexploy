import { Redis } from 'ioredis';
import { deployerConfig } from '@/deployer/config';
import { logger } from '@/utils/logger';
import type { BuildJob, BuildLogEntry } from '@/deployer/types';

const JOBS_PREFIX = 'build:job:';
const LOGS_PREFIX = 'build:logs:';
const JOB_TTL = 60 * 60 * 24 * 7; // 7 days

let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        redis = new Redis({
            host: deployerConfig.redis.host,
            port: deployerConfig.redis.port,
            password: deployerConfig.redis.password,
            maxRetriesPerRequest: 3,
            db: 1,
        });
    }
    return redis;
}

class BuildJobStore {
    private localCache: Map<string, BuildJob> = new Map();

    async set(id: string, job: BuildJob): Promise<void> {
        this.localCache.set(id, job);

        try {
            const jobData = {
                ...job,
                logs: undefined,
                createdAt: job.createdAt.toISOString(),
                updatedAt: job.updatedAt.toISOString(),
                completedAt: job.completedAt?.toISOString(),
            };
            await getRedis().setex(`${JOBS_PREFIX}${id}`, JOB_TTL, JSON.stringify(jobData));
        } catch (err) {
            logger.warn({ err, jobId: id }, 'Failed to persist job to Redis');
        }
    }

    get(id: string): BuildJob | undefined {
        return this.localCache.get(id);
    }

    async getFromRedis(id: string): Promise<BuildJob | undefined> {
        try {
            const data = await getRedis().get(`${JOBS_PREFIX}${id}`);
            if (!data) return undefined;

            const parsed = JSON.parse(data);
            const logs = await this.getLogs(id);

            return {
                ...parsed,
                logs,
                createdAt: new Date(parsed.createdAt),
                updatedAt: new Date(parsed.updatedAt),
                completedAt: parsed.completedAt ? new Date(parsed.completedAt) : undefined,
            };
        } catch (err) {
            logger.warn({ err, jobId: id }, 'Failed to get job from Redis');
            return undefined;
        }
    }

    async delete(id: string): Promise<boolean> {
        this.localCache.delete(id);

        try {
            await getRedis().del(`${JOBS_PREFIX}${id}`, `${LOGS_PREFIX}${id}`);
            return true;
        } catch (err) {
            logger.warn({ err, jobId: id }, 'Failed to delete job from Redis');
            return false;
        }
    }

    getAll(): BuildJob[] {
        return Array.from(this.localCache.values());
    }

    has(id: string): boolean {
        return this.localCache.has(id);
    }

    async addLog(id: string, log: BuildLogEntry): Promise<void> {
        const job = this.localCache.get(id);
        if (job) {
            job.logs.push(log);
        }

        try {
            const logData = {
                ...log,
                timestamp: log.timestamp.toISOString(),
            };
            await getRedis().rpush(`${LOGS_PREFIX}${id}`, JSON.stringify(logData));
            await getRedis().expire(`${LOGS_PREFIX}${id}`, JOB_TTL);
        } catch (err) {
            logger.warn({ err, jobId: id }, 'Failed to persist log to Redis');
        }
    }

    async getLogs(id: string): Promise<BuildLogEntry[]> {
        try {
            const logs = await getRedis().lrange(`${LOGS_PREFIX}${id}`, 0, -1);
            return logs.map((log) => {
                const parsed = JSON.parse(log);
                return {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp),
                };
            });
        } catch (err) {
            logger.warn({ err, jobId: id }, 'Failed to get logs from Redis');
            return [];
        }
    }

    async getLogsCount(id: string): Promise<number> {
        try {
            return await getRedis().llen(`${LOGS_PREFIX}${id}`);
        } catch (err) {
            return 0;
        }
    }

    async getLogsSince(id: string, startIndex: number): Promise<BuildLogEntry[]> {
        try {
            const logs = await getRedis().lrange(`${LOGS_PREFIX}${id}`, startIndex, -1);
            return logs.map((log) => {
                const parsed = JSON.parse(log);
                return {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp),
                };
            });
        } catch (err) {
            logger.warn({ err, jobId: id }, 'Failed to get logs from Redis');
            return [];
        }
    }

    async closeRedis(): Promise<void> {
        if (redis) {
            await redis.quit();
            redis = null;
        }
    }
}

export const buildJobStore = new BuildJobStore();
