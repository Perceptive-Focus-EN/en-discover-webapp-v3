type EventHandler = (data: any) => void;

export class ServiceBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private readonly SYSTEM_EVENTS = [
    'log.',
    'metric.',
    'circuit.',
    'monitor.',
    'system.'
  ];

  private isSystemEvent(event: string): boolean {
    return this.SYSTEM_EVENTS.some(prefix => event.startsWith(prefix));
  }

  public on(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  public emit(event: string, data: any): void {
    const handlers = this.handlers.get(event) || [];
    
    // Only suppress system events in production
    if (this.isSystemEvent(event) && process.env.NODE_ENV === 'production') {
      // Still handle critical system events
      if (data?.critical || event.includes('error') || event.includes('failed')) {
        handlers.forEach(handler => handler(data));
      }
      // Skip non-critical system events in production
      return;
    }

    handlers.forEach(handler => handler(data));
  }
}