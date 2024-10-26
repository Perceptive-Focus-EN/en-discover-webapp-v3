// src/MonitoringSystem/utils/CircuitBreaker.ts
export class CircuitBreaker {
  private readonly MAX_ERRORS = 3;
  private readonly RESET_TIMEOUT = 5000;
  private errorCount: Map<string, number> = new Map();
  private breakerStatus: Map<string, boolean> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  public isOpen(circuit: string): boolean {
    return this.breakerStatus.get(circuit) || false;
  }

  public recordError(circuit: string): void {
    const currentCount = (this.errorCount.get(circuit) || 0) + 1;
    this.errorCount.set(circuit, currentCount);

    if (currentCount >= this.MAX_ERRORS) {
      this.openCircuit(circuit);
    }
  }

  private openCircuit(circuit: string): void {
    this.breakerStatus.set(circuit, true);
    
    // Clear any existing timeout
    const existingTimeout = this.timeouts.get(circuit);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set reset timeout
    const timeout = setTimeout(() => {
      this.resetCircuit(circuit);
    }, this.RESET_TIMEOUT);

    this.timeouts.set(circuit, timeout);
  }

  private resetCircuit(circuit: string): void {
    this.breakerStatus.set(circuit, false);
    this.errorCount.set(circuit, 0);
    this.timeouts.delete(circuit);
  }

    public recordSuccess(circuit: string): void {
    // Reset error count on success
    this.errorCount.set(circuit, 0);
    if (this.isOpen(circuit)) {
      this.breakerStatus.set(circuit, false);
      const existingTimeout = this.timeouts.get(circuit);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.timeouts.delete(circuit);
      }
    }
  }

}



















