// src/MonitoringSystem/core/ServiceBus.ts
type EventHandler = (data: any) => void;

export class ServiceBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  public on(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  public emit(event: string, data: any): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}