type WidgetConfig = {
    id: string;
    type: string;
    title: string;
    size: { w: number; h: number };
    position: { x: number; y: number };
    props: Record<string, any>;
  };