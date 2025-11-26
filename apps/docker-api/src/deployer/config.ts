export const deployerConfig = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380', 10),
        password: process.env.REDIS_PASSWORD || 'redis',
    },
    workDir: process.env.DEPLOYER_WORK_DIR || '/tmp/deployer',
};
