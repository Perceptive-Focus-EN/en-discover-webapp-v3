


// src/MonitoringSystem/types/metrics.ts
export interface CircuitBreakerStatus {
    socket_connection: boolean;
    resource_limit: boolean;
    rate_limit: boolean;
    payment_gateway: boolean;
    node_migration: boolean;
}
export class CircuitBreaker {
  private readonly MAX_ERRORS = 3;
  private readonly RESET_TIMEOUT = 5000;
  private readonly SYSTEM_CIRCUITS = ['logger', 'metric', 'monitor', 'circuit'];
  private readonly API_CIRCUITS = ['/api/logs', '/api/metrics'];
  
  private errorCount: Map<string, number> = new Map();
  private breakerStatus: Map<string, boolean> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  private isSystemCircuit(circuit: string): boolean {
    return this.SYSTEM_CIRCUITS.some(type => circuit.includes(type)) ||
          this.API_CIRCUITS.some(path => circuit.includes(path));
  }

  private handleSystemCircuit(circuit: string, operation: () => void): void {
    try {
      operation();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`System circuit operation error for ${circuit}:`, error);
      }
    }
  }

  private handleBusinessCircuit(circuit: string, operation: () => void): void {
    try {
      operation();
    } catch (error) {
      console.error(`Business circuit operation error for ${circuit}:`, error);
      throw error; // Re-throw for business circuits
    }
  }

  private executeOperation(circuit: string, operation: () => void): void {
    if (this.isSystemCircuit(circuit)) {
      this.handleSystemCircuit(circuit, operation);
    } else {
      this.handleBusinessCircuit(circuit, operation);
    }
  }

  public isOpen(circuit: string): boolean {
    return this.breakerStatus.get(circuit) || false;
  }

  public recordError(circuit: string): void {
    this.executeOperation(circuit, () => {
      const currentCount = (this.errorCount.get(circuit) || 0) + 1;
      this.errorCount.set(circuit, currentCount);
      if (currentCount >= this.MAX_ERRORS) {
        this.openCircuit(circuit);
      }
    });
  }

  private openCircuit(circuit: string): void {
    this.executeOperation(circuit, () => {
      this.breakerStatus.set(circuit, true);
      
      const existingTimeout = this.timeouts.get(circuit);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        this.resetCircuit(circuit);
      }, this.RESET_TIMEOUT);
      
      this.timeouts.set(circuit, timeout);
    });
  }

  private resetCircuit(circuit: string): void {
    this.executeOperation(circuit, () => {
      this.breakerStatus.set(circuit, false);
      this.errorCount.set(circuit, 0);
      this.timeouts.delete(circuit);
    });
  }

  public recordSuccess(circuit: string): void {
    this.executeOperation(circuit, () => {
      this.errorCount.set(circuit, 0);
      
      if (this.isOpen(circuit)) {
        this.breakerStatus.set(circuit, false);
        const existingTimeout = this.timeouts.get(circuit);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          this.timeouts.delete(circuit);
        }
      }
    });
  }

  public isMonitoringCircuit(circuit: string): boolean {
    return this.isSystemCircuit(circuit);
  }
}
