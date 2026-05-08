import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';

export interface BaseMonitorConfig {
    monitorName: string;
    checkIntervalMs?: number;
    maxListeners?: number;
}

export abstract class BaseMonitor extends EventEmitter {
    protected readonly monitorName: string;
    protected isRunning: boolean = false;
    protected checkInterval: NodeJS.Timeout | null = null;
    protected readonly CHECK_INTERVAL_MS: number;
    protected lastCheck: number = 0;

    protected constructor(config: BaseMonitorConfig) {
        super();
        this.monitorName = config.monitorName;
        this.CHECK_INTERVAL_MS = config.checkIntervalMs ?? 5000;
        this.setMaxListeners(config.maxListeners ?? 100);
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn(`${this.monitorName} already running`);
            return;
        }

        this.isRunning = true;
        logger.info(`Starting ${this.monitorName}`);

        await this.performInitialCheck();
        this.startPeriodicCheck();
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;

        this.isRunning = false;
        logger.info(`Stopping ${this.monitorName}`);

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.onStop();
        this.removeAllListeners();
    }

    private async performInitialCheck(): Promise<void> {
        await this.emitConnecting();
        const initialStatus = await this.performCheck();
        this.lastCheck = Date.now();
        await this.handleStatusChange(initialStatus, true);
    }

    private startPeriodicCheck(): void {
        this.checkInterval = setInterval(async () => {
            if (!this.isRunning) return;

            const now = Date.now();
            this.lastCheck = now;

            const currentStatus = await this.getCurrentStatus();

            if (!this.isStatusOk(currentStatus) && !this.isStatusConnecting(currentStatus)) {
                await this.emitReconnecting();
            }

            const newStatus = await this.performCheck();

            if (this.hasStatusChanged(currentStatus, newStatus)) {
                await this.handleStatusChange(newStatus, false);
            }
        }, this.CHECK_INTERVAL_MS);

        logger.info(
            { interval: this.CHECK_INTERVAL_MS },
            `${this.monitorName} periodic check started`,
        );
    }

    getLastCheck(): number {
        return this.lastCheck;
    }

    getStats(): Record<string, any> {
        return {
            isRunning: this.isRunning,
            lastCheck: this.lastCheck,
            ...this.getCustomStats(),
        };
    }

    protected abstract performCheck(): Promise<any>;
    protected abstract getCurrentStatus(): any;
    protected abstract isStatusOk(status: any): boolean;
    protected abstract isStatusConnecting(status: any): boolean;
    protected abstract hasStatusChanged(oldStatus: any, newStatus: any): boolean;
    protected abstract handleStatusChange(status: any, isInitial: boolean): Promise<void>;
    protected abstract emitConnecting(): Promise<void>;
    protected abstract emitReconnecting(): Promise<void>;
    protected abstract onStop(): void;
    protected abstract getCustomStats(): Record<string, any>;
}
