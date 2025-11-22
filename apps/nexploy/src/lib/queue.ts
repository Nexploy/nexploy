import { Queue } from 'bullmq';

export const buildQueueName = 'build-queue';

export const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const buildQueue = new Queue(buildQueueName, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const addBuildJob = async (deploymentId: string) => {
  return buildQueue.add('build', { deploymentId });
};
