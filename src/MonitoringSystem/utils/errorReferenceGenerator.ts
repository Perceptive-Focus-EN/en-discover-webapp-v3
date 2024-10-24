import { ErrorComponent } from "@/MonitoringSystem/types/ErrorPatternsList";

// src/MonitoringSystem/utils/errorReferenceGenerator.ts
export class ErrorReferenceGenerator {
  static generate(components: ErrorComponent): string {
    const timestamp = Date.now().toString(36);
    const { category, component, action, context } = components;

    const parts = [
      category,
      component || context || '',
      action,
      timestamp
    ].filter(Boolean);

    return parts.join('_').toUpperCase();
  }

  static parse(reference: string): ErrorComponent {
    const [category, component, action, timestamp] = reference.split('_');
    return {
      category: category as ErrorComponent['category'],
      component,
      action,
      timestamp
    };
  }
}