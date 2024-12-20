import {
  ShowChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterChartIcon,
  BubbleChart as AreaChartIcon,
  Radar as RadarChartIcon,
  Map as MapIcon,
  MultilineChart as MultiLineChartIcon,
  Collections as ComposedChartIcon,
  StackedBarChart as StackedBarChartIcon,
  BubbleChart as BubbleChartIcon,
  ThreeMp as TreemapChartIcon,
  WaterfallChart as WaterfallChartIcon,
  SurroundSoundSharp as ClusterChartIcon,
  Analytics as AdvancedSalesExpensesChartIcon,
  CandlestickChart as CandlestickChartIcon,
  Highlight as HighlightChartIcon,
  WavesOutlined as OHLCChartIcon,
  Forest as ForecastChartIcon,
  TrendingUp as TrendChartIcon,
  ScatterPlot as ThreeDScatterChartIcon,
  ThreeDRotation as ThreeDSurfaceChartIcon,
  BarChart as BoxplotChartIcon,
  FilterNone as FunnelChartIcon,
  Key as SankeyChartIcon,
  HeatPump as HeatmapChartIcon,
} from '@mui/icons-material';


export type ChartType = 
'line' 
| 'multiLine' 
| 'bar' 
| 'stackedBar' 
| 'pie' 
| 'scatter' 
| 'area' 
| 'composed' 
| 'radar' 
| 'map' 
| 'bubble' 
| 'treemap' 
| 'advancedSalesExpenses'
| 'ohlc'
| 'candlestick'
| 'waterfall'
| 'heatmap'
| 'cluster'
| 'highlight'
| 'forecast'
| 'trend'
| 'funnel'
| 'sankey'
| '3dScatter'
| '3dSurface'
| 'boxplot'
| 'waterfall'

;

export const chartIcons: { [key in ChartType]: React.ComponentType } = {
  line: LineChartIcon,
  bar: BarChartIcon,
  area: AreaChartIcon,
  scatter: ScatterChartIcon,
  pie: PieChartIcon,
  radar: RadarChartIcon,
  map: MapIcon,
  multiLine: MultiLineChartIcon,
  stackedBar: StackedBarChartIcon,
  composed: ComposedChartIcon,
  bubble: BubbleChartIcon,
  treemap: TreemapChartIcon,
  advancedSalesExpenses: AdvancedSalesExpensesChartIcon,
  ohlc: OHLCChartIcon,
  candlestick: CandlestickChartIcon,
  waterfall: WaterfallChartIcon,
  heatmap: HeatmapChartIcon,
  cluster: ClusterChartIcon,
  highlight: HighlightChartIcon,
  forecast: ForecastChartIcon,
  trend: TrendChartIcon,
  funnel: FunnelChartIcon,
  sankey: SankeyChartIcon,
  '3dScatter': ThreeDScatterChartIcon,
  '3dSurface': ThreeDSurfaceChartIcon,
  boxplot: BoxplotChartIcon,
};