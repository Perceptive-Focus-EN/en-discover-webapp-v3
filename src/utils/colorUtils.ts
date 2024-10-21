// src/utils/colorUtils.ts

import { ValidHexColor, isValidHexColor } from '../components/EN/types/colorPalette';

// Helper function to create a record of ValidHexColors or arrays of ValidHexColors
function createColorRecord<T extends Record<string, string | string[]>>(
  obj: T
): { [K in keyof T]: ValidHexColor | ValidHexColor[] } {
  const result: Partial<{ [K in keyof T]: ValidHexColor | ValidHexColor[] }> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isValidHexColor(value)) {
      result[key as keyof T] = value as ValidHexColor;
    } else if (
      Array.isArray(value) &&
      value.every((color) => typeof color === 'string' && isValidHexColor(color))
    ) {
      result[key as keyof T] = value as ValidHexColor[];
    } else {
      console.warn(`Invalid color value: ${value} for key: ${key}`);
    }
  }
  return result as { [K in keyof T]: ValidHexColor | ValidHexColor[] };
}

export const tailwindColors: Record<
  string,
  Record<string, ValidHexColor | ValidHexColor[]>
> = {
  blue: createColorRecord({
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    gradient: ['#3B82F6', '#1D4ED8'], // Vibrant Palette
    'dark-gradient': ['#1E40AF', '#1E3A8A'], // Gothic Palette
  }),
  red: createColorRecord({
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    gradient: ['#EF4444', '#B91C1C'], // Vibrant Palette
    'deep-gradient': ['#DC2626', '#B91C1C'], // Earthy Palette
    'dark-gradient': ['#991B1B', '#7F1D1D'], // Gothic Palette
  }),
  emerald: createColorRecord({
    300: ['#6EE7B7', '#34D399'], // Pastel Palette Gradient
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    gradient: ['#10B981', '#059669'], // Vibrant Palette
    'dark-gradient': ['#065F46', '#064E3B'], // Gothic Palette
  }),
  yellow: createColorRecord({
    200: '#fef08a',
    300: ['#FEF08A', '#FDE047'], // Pastel Palette Gradient
    400: '#fcd34d',
    500: '#fbbf24',
    600: '#f59e0b',
    700: '#d97706',
    800: '#b45309',
    900: '#92400e',
    gradient: ['#FCD34D', '#F59E0B'], // Vibrant Palette
    'gold-gradient': ['#EAB308', '#CA8A04'], // Earthy Palette
  }),
  purple: createColorRecord({
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    gradient: ['#8B5CF6', '#7C3AED'], // Vibrant Palette
    'deep-gradient': ['#9333EA', '#7E22CE'], // Earthy Palette
    'dark-gradient': ['#6D28D9', '#4C1D95'], // Gothic Palette
  }),
  pink: createColorRecord({
    300: ['#F9A8D4', '#F472B6'], // Pastel Palette Gradient
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    gradient: ['#EC4899', '#DB2777'], // Vibrant Palette
    'maroon-gradient': ['#9F1239', '#881337'], // Gothic Palette
  }),
  orange: createColorRecord({
    300: ['#FDBA74', '#FB923C'], // Pastel Palette Gradient
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    gradient: ['#FB923C', '#EA580C'], // Vibrant Palette
    'deep-gradient': ['#F97316', '#EA580C'], // Earthy Palette
  }),
  teal: createColorRecord({
    300: ['#5EEAD4', '#2DD4BF'], // Pastel Palette Gradient
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    gradient: ['#2DD4BF', '#0D9488'], // Vibrant Palette
    'dark-gradient': ['#0F766E', '#115E59'], // Gothic Palette
  }),
  sky: createColorRecord({
    300: ['#7DD3FC', '#38BDF8'], // Pastel Palette Gradient
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  }),
  rose: createColorRecord({
    300: ['#FDA4AF', '#FB7185'], // Pastel Palette Gradient
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: ['#9F1239', '#881337'], // Gothic Palette Gradient
    900: '#881337',
  }),
  amber: createColorRecord({
    500: '#f59e0b',
    600: '#d97706',
    700: ['#B45309', '#92400E'], // Earthy Palette Gradient
    800: '#92400e',
    900: '#78350f',
  }),
  cyan: createColorRecord({
    500: '#06b6d4',
    600: ['#0891B2', '#0E7490'], // Earthy Palette Gradient
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  }),
  green: createColorRecord({
    500: '#22c55e',
    600: ['#16A34A', '#15803D'], // Earthy Palette Gradient
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  }),
  gray: createColorRecord({
    300: ['#D1D5DB', '#9CA3AF'], // Gothic Palette Gradient (Silver)
    400: '#9ca3af',
    500: '#6b7280',
    600: ['#6B7280', '#4B5563'], // Earthy Palette Gradient
    700: '#4b5563',
    800: '#374151',
    900: ['#111827', '#000000'], // Gothic Palette Gradient (Black)
  }),
  black: createColorRecord({
    DEFAULT: '#000000',
    gradient: ['#111827', '#000000'], // Gothic Palette
  }),
  white: createColorRecord({
    DEFAULT: '#ffffff',
  }),
};

export type ColorName = keyof typeof tailwindColors;
export type ShadeIntensity = string | 'DEFAULT';

export function getTailwindColor(
  colorName: ColorName,
  shade: ShadeIntensity
): ValidHexColor | ValidHexColor[] | null {
  const color = tailwindColors[colorName];
  if (!color) return null;
  return color[shade] || null;
}

export function convertTailwindToHex(
  colorClass: string
): ValidHexColor | ValidHexColor[] | null {
  const [colorName, shade] = colorClass.split('-') as [ColorName, ShadeIntensity];
  return getTailwindColor(colorName, shade);
}

// Utility function to create a linear gradient CSS string
export function createGradient(colors: ValidHexColor[]): string {
  return `linear-gradient(to bottom, ${colors.join(', ')})`;
}

// Example usage:
// const gradient = createGradient(['#3B82F6', '#1D4ED8']);
