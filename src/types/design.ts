

export type ToolType = 'analytics' | 'draw' | 'other_tool'

export interface DesignObjectProperties {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  material: {
    metalness: number;
    roughness: number;
    wireframe: boolean;
    [key: string]: any;  // Allow for additional properties
  };
  [key: string]: any;  // Allow for additional properties
}

export interface DesignObject {
  id: string;
  type: string;
  properties: DesignObjectProperties | Record<string, any>;
}

export interface DesignState {
  currentTool: ToolType | null;
  objects: DesignObject[];
  selectedObjectId: string | null;
  zoomLevel: number;
  canvasSize: { width: number; height: number };
  groupedObjects: { [key: string]: string[] };
  time: number;

}


export interface TimeSliderProps {
  value: number;
  onChange: (time: number) => void;
  min?: number;
  max?: number;
  step?: number;
}



