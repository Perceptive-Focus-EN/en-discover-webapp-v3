// src/MonitoringSystem/utils/LogBuffer.ts
export class LogBuffer {
  private static instance: LogBuffer;
  private buffer: Map<string, any[]> = new Map();
  private flushCallbacks: Map<string, (items: any[]) => Promise<void>> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private lastFlushTime: Map<string, number> = new Map();

  private readonly MAX_BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MIN_FLUSH_INTERVAL = 1000; // 1 second between flushes
  private readonly MAX_RETRY_ATTEMPTS = 3;

  private constructor() {}

  public static getInstance(): LogBuffer {
    if (!LogBuffer.instance) {
      LogBuffer.instance = new LogBuffer();
    }
    return LogBuffer.instance;
  }

  public register(
    key: string, 
    flushCallback: (items: any[]) => Promise<void>
  ) {
    this.buffer.set(key, []);
    this.flushCallbacks.set(key, flushCallback);
    this.lastFlushTime.set(key, 0);
    this.setupFlushInterval(key);
  }

  public add(key: string, item: any) {
    const buffer = this.buffer.get(key) || [];
    buffer.push(item);
    this.buffer.set(key, buffer);

    // Only trigger flush if enough time has passed
    if (buffer.length >= this.MAX_BUFFER_SIZE && this.canFlush(key)) {
      void this.flush(key);
    }
  }

  private canFlush(key: string): boolean {
    const lastFlush = this.lastFlushTime.get(key) || 0;
    return Date.now() - lastFlush >= this.MIN_FLUSH_INTERVAL;
  }

  private setupFlushInterval(key: string) {
    const interval = setInterval(async () => {
      if (this.canFlush(key)) {
        await this.flush(key);
      }
    }, this.FLUSH_INTERVAL);
    this.timeouts.set(key, interval);
  }

  private async flush(key: string, attempt = 1): Promise<void> {
    const buffer = this.buffer.get(key) || [];
    if (buffer.length === 0) return;

    const callback = this.flushCallbacks.get(key);
    if (!callback) return;

    try {
      const items = [...buffer];
      this.buffer.set(key, []); // Clear before sending
      this.lastFlushTime.set(key, Date.now());

      await callback(items);
    } catch (error) {
      // Retry logic
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.flush(key, attempt + 1);
      }

      // If all retries fail, put items back in buffer
      const currentBuffer = this.buffer.get(key) || [];
      this.buffer.set(key, [...buffer, ...currentBuffer]);
      console.error(`Failed to flush ${key} after ${attempt} attempts:`, error);
    }
  }

  public getSize(key: string): number {
    return (this.buffer.get(key) || []).length;
  }

  public destroy() {
    this.timeouts.forEach(timeout => clearInterval(timeout));
    this.timeouts.clear();
    this.buffer.clear();
    this.flushCallbacks.clear();
    this.lastFlushTime.clear();
  }
}