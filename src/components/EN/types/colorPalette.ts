// Define a type for valid hex color strings
export type HexColor = `#${string}`;

// Helper type to ensure the string is a valid hex color
export type ValidHexColor = HexColor & {
  readonly [Symbol.toStringTag]: "ValidHexColor";
  readonly length: 4 | 7;
};

// Function to validate hex colors at runtime
export function isValidHexColor(color: string): color is ValidHexColor {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
}

// Function to convert hex to rgba
export function hexToRgba(hex: ValidHexColor | string, alpha: number = 1): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Define the color palette types
export interface ColorPalette {
  id: number;
  paletteName: string;
  categoryId: string;
  colors: ValidHexColor[];
  type: string;
}

// Function to create a palette with runtime validation
export function createPalette(
  id: number,
  paletteName: string,
  categoryId: string,
  colors: string[],
  type: string
): ColorPalette {
  const validColors = colors.filter(isValidHexColor) as ValidHexColor[];
  if (validColors.length !== colors.length) {
    console.warn(`Some colors in palette "${paletteName}" were invalid and have been filtered out.`);
  }
  return { id, paletteName, categoryId, colors: validColors, type };
}

// Define palettes with hardcoded IDs
export const vibrantPalette = createPalette(
  1,
  "Vibrant",
  "custom",
  ["#3B82F6", "#1D4ED8", "#EF4444", "#B91C1C", "#10B981", "#059669", "#FCD34D", "#F59E0B",
   "#8B5CF6", "#7C3AED", "#EC4899", "#DB2777", "#FB923C", "#EA580C", "#2DD4BF", "#0D9488"],
  "custom"
);

export const pastelPalette = createPalette(
  2,
  "Pastel",
  "custom",
  ["#7DD3FC", "#38BDF8", "#FDA4AF", "#FB7185", "#6EE7B7", "#34D399", "#FEF08A", "#FDE047",
   "#C4B5FD", "#A78BFA", "#F9A8D4", "#F472B6", "#FDBA74", "#FB923C", "#5EEAD4", "#2DD4BF"],
  "custom"
);

export const earthyPalette = createPalette(
  3,
  "Earthy",
  "custom",
  ["#B45309", "#92400E", "#16A34A", "#15803D", "#0891B2", "#0E7490", "#F97316", "#EA580C",
   "#DC2626", "#B91C1C", "#EAB308", "#CA8A04", "#9333EA", "#7E22CE", "#6B7280", "#4B5563"],
  "custom"
);

export const gothicPalette = createPalette(
  4,
  "Gothic",
  "custom",
  ["#111827", "#000000", "#991B1B", "#7F1D1D", "#6D28D9", "#4C1D95", "#065F46", "#064E3B",
   "#1E40AF", "#1E3A8A", "#9F1239", "#881337", "#0F766E", "#115E59", "#D1D5DB", "#9CA3AF"],
  "custom"
);

export const palettes: ColorPalette[] = [
  vibrantPalette,
  pastelPalette,
  earthyPalette,
  gothicPalette,
];

// Example of how to add a new palette
const oceanBluesPalette = createPalette(
  5, // Next available ID
  "Ocean Blues",
  "nature-inspired",
  ["#0077be", "#58a7c6", "#89cff0"],
  "analogous"
);

// Utility function to create a linear gradient from a palette
export function createGradient(palette: ColorPalette, direction: string = 'to right'): string {
  return `linear-gradient(${direction}, ${palette.colors.map(hexToRgba).join(', ')})`;
}

// Utility function to create a radial gradient from a palette
export function createRadialGradient(palette: ColorPalette, shape: string = 'circle'): string {
  return `radial-gradient(${shape}, ${palette.colors.map(hexToRgba).join(', ')})`;
}

// Type for color that can be either a ValidHexColor or an array of ValidHexColors
export type ColorType = ValidHexColor | ValidHexColor[];

// Function to get a string key for a color (for use in objects)
export function colorKey(color: ColorType): string {
  return Array.isArray(color) ? color.join('-') : color;
}