import { BaseAIResponse, ExtendedChartType } from '../types';
import {ChartType} from '../types/DataTypes';
import { ParsedResult, AIInsight } from '../types/AiInsightChart';
import { FinancialChartData, FinancialDataPoint } from '../types/finance';
import { ChartData } from '../types/DataTypes';
import axios from 'axios';

type ContextType = 'general' | 'marketing' | 'financial';

export function getSystemPrompt(): string {
  return `You are an AI assistant that provides comprehensive business analytics and insights. 
    Provide a detailed analysis, including key trends, notable statistics, and actionable insights.

    When generating chart data, use one of the following structures based on the chart type:

    1. For 'line', 'bar', 'area' charts:
    {
      type: 'line' | 'bar' | 'area',
      data: [
        { name: 'Category1', value: 100 },
        { name: 'Category2', value: 200 },
        { name: 'Category3', value: 150 }
      ],
      dataKeys: ['name', 'value'],
      title: 'Sample Chart Title'
    }

    2. For 'multiLine' charts:
    {
      type: 'multiLine',
      data: [
        { name: 'Jan', series1: 100, series2: 200, series3: 150 },
        { name: 'Feb', series1: 120, series2: 220, series3: 180 },
        { name: 'Mar', series1: 140, series2: 240, series3: 210 }
      ],
      dataKeys: ['name', 'series1', 'series2', 'series3'],
      title: 'Multi-line Chart Title'
    }

    3. For 'pie' charts:
    {
      type: 'pie',
      data: [
        { name: 'Category1', value: 30 },
        { name: 'Category2', value: 50 },
        { name: 'Category3', value: 20 }
      ],
      dataKeys: ['name', 'value'],
      title: 'Pie Chart Title'
    }

    4. For 'scatter' charts:
    {
      type: 'scatter',
      data: [
        { x: 10, y: 30, z: 40 },
        { x: 20, y: 50, z: 60 },
        { x: 30, y: 70, z: 80 }
      ],
      dataKeys: ['x', 'y', 'z'],
      title: 'Scatter Plot Title'
    }

    5. For 'radar' charts:
    {
      type: 'radar',
      data: [
        { category: 'A', value1: 80, value2: 90 },
        { category: 'B', value1: 70, value2: 80 },
        { category: 'C', value1: 60, value2: 70 },
        { category: 'D', value1: 50, value2: 60 }
      ],
      dataKeys: ['category', 'value1', 'value2'],
      title: 'Radar Chart Title'
    }

    6. For 'treemap' charts:
    {
      type: 'treemap',
      data: [
        { name: 'Category1', size: 100, color: '#8884d8' },
        { name: 'Category2', size: 200, color: '#82ca9d' },
        { name: 'Category3', size: 150, color: '#ffc658' }
      ],
      dataKeys: ['name', 'size'],
      title: 'Treemap Chart Title'
    }

    7. For 'heatmap' charts:
    {
      type: 'heatmap',
      data: [
        { x: 'A', y: '1', value: 10 },
        { x: 'B', y: '2', value: 20 },
        { x: 'C', y: '3', value: 30 }
      ],
      dataKeys: ['x', 'y', 'value'],
      title: 'Heatmap Chart Title'
    }

    8. For 'candlestick' charts (financial):
    {
      type: 'candlestick',
      data: [
        { date: '2023-01-01', open: 50, high: 60, low: 40, close: 55 },
        { date: '2023-01-02', open: 55, high: 65, low: 45, close: 60 },
        { date: '2023-01-03', open: 60, high: 70, low: 50, close: 65 }
      ],
      dataKeys: ['date', 'open', 'high', 'low', 'close'],
      title: 'Candlestick Chart Title'
    }

    9. For 'advancedSalesExpenses' charts:
    {
      type: 'advancedSalesExpenses',
      data: [
        { month: 'Jan', sales: 1000, expenses: 700, customers: 50, profit: 300 },
        { month: 'Feb', sales: 1200, expenses: 800, customers: 60, profit: 400 },
        { month: 'Mar', sales: 1100, expenses: 750, customers: 55, profit: 350 }
      ],
      dataKeys: ['month', 'sales', 'expenses', 'customers', 'profit'],
      title: 'Advanced Sales, Expenses, and Customers Analysis'
    }

    10. For 'cluster' charts:
    {
      type: 'cluster',
      data: [
        { id: 'A', group: 1 },
        { id: 'B', group: 2 },
        { id: 'C', group: 1 }
      ],
      dataKeys: ['id', 'group'],
      title: 'Cluster Chart Title'
    }

    11. For 'highlight' charts:
    {
      type: 'highlight',
      data: [
        { name: 'Category1', value: 100, highlight: true },
        { name: 'Category2', value: 200, highlight: false }
      ],
      dataKeys: ['name', 'value', 'highlight'],
      title: 'Highlight Chart Title'
    }

    12. For 'trend' charts:
    {
      type: 'trend',
      data: [
        { date: '2023-01', value: 100 },
        { date: '2023-02', value: 150 },
        { date: '2023-03', value: 200 }
      ],
      dataKeys: ['date', 'value'],
      title: 'Trend Chart Title'
    }

    13. For 'forecast' charts:
    {
      type: 'forecast',
      data: [
        { date: '2023-01', actual: 100, forecast: 110 },
        { date: '2023-02', actual: 150, forecast: 160 },
        { date: '2023-03', actual: 200, forecast: 210 }
      ],
      dataKeys: ['date', 'actual', 'forecast'],
      title: 'Forecast Chart Title'
    }

14. For 'map' charts:
{
  type: 'map',
  title: 'US Cities Population Density',
  data: [
    { latitude: 40.7128, longitude: -74.0060, value: 100, name: 'New York City' },
    { latitude: 34.0522, longitude: -118.2437, value: 200, name: 'Los Angeles' },
    { latitude: 41.8781, longitude: -87.6298, value: 300, name: 'Chicago' }
  ],
  dataKeys: ['latitude', 'longitude', 'value', 'name'],
  mapConfig: {
    mapType: 'markers' | 'heatmap' | 'cluster' | 'choropleth' | 'bubble',
    dataSource: 'chartData' | 'census' | 'worldBank' | 'openStreetMap',
    censusConfig: {
      endpoint: 'pep/population',
      getParams: ['NAME', 'POP'],
      forClause: 'state:*',
      year: '2019',
      stateIndex: 0
    },
    worldBankConfig: {
      queryType: 'indicator',
      country: 'all',
      indicator: 'SP.POP.TOTL,EN.ATM.CO2E.PC,NY.GDP.PCAP.CD',
      dateRange: ['2010', '2020'],
      perPage: { page: 1, pageSize: 100 }
    },
    openStreetMapConfig: {
      query: 'node["amenity"="restaurant"]',
      boundingBox: [-180, -90, 180, 90]
    },
    colorScale: ['#ffeda0', '#feb24c', '#f03b20'],
    minColor: '#ffeda0',
    maxColor: '#f03b20',
    radiusScale: [5, 20],
    clusterRadius: 50,
    heatmapIntensity: 0.6,
    heatmapRadius: 30,
    choroplethProperty: 'value',
    bubbleProperty: 'value',
    clusterProperties: ['sum', 'avg'],
    tooltipProperties: ['name', 'value']
  },
  customConfig: {
    zoom: 4,
    center: [-98.5795, 39.8283],
    minZoom: 2,
    maxZoom: 18,
    interactiveLayerIds: ['data-layer']
  }
}

For map charts, ensure that each data point includes 'latitude' and 'longitude' properties. The 'value' property can be used for sizing markers or determining heatmap intensity. The 'name' property can be used for labels or tooltips. The 'mapConfig' property defines how the data should be visualized on the map, including the map type, data source, and various visualization settings. The 'customConfig' property allows for additional map customization.
    Ensure the generated chart data follows one of these structures exactly so it can be directly visualized using the DynamicChart component.`;
}

export function generatePrompt(
  input: string,
  currentChartData?: ChartData | FinancialChartData,
  contextType: ContextType = 'general'
): string {
  const chartTypes: ExtendedChartType[] = [
    'line', 'multiLine', 'bar', 'stackedBar', 'pie', 'scatter', 'area', 'composed',
    'radar', 'treemap', 'heatmap', 'candlestick', 'boxplot', 'funnel', 'sankey',
    'waterfall', 'advancedSalesExpenses', 'cluster', 'highlight', 'trend', 'forecast',
    'map', '3dScatter', 'bubble', 'ohlc','3dSurface'
  ];
  const chartTypeString = chartTypes.map(type => `"${type}"`).join(' | ');

  const contextSpecificPrompts = {
    general: "Consider general trends, patterns, and outliers in the data.",
    marketing: "Focus on customer behavior, campaign performance, and market segmentation.",
    financial: "Analyze financial metrics, risk factors, and investment opportunities."
  };

  const basePrompt = `
    Analyze the following ${contextType} data${currentChartData?.title ? ` for ${currentChartData.title}` : ''} and provide insights based on this user query: "${input}"

    ${contextSpecificPrompts[contextType]}

    Please format your response as follows:

    1. Summary: Provide a brief 1-2 sentence summary of the key findings.

    2. Key Insights: List 3-5 key insights, each starting with a "-" on a new line.

    3. Detailed Analysis: Provide a more in-depth analysis of the data and insights. Include:
       - Identification of any significant trends or patterns
       - Notable correlations between different data points
       - Potential causal relationships
       - Any anomalies or outliers and their potential significance

    4. Suggested Visualizations: Suggest 2-3 chart types that would best represent the data and insights. For each, provide:
       {
         "type": ${chartTypeString},
         "data": [
           // Example data structure
         ],
         "dataKeys": ["key1", "key2", ...],
         "title": "Suggested Chart Title",
         "description": "Brief explanation of why this visualization is appropriate"
       }

    5. AI Insights: Provide 3-5 AI-generated insights in the following format:
       {
         "type": "trend" | "anomaly" | "forecast" | "correlation" | "cluster",
         "description": "Detailed description of the insight",
         "confidence": 0.0 to 1.0,
         "impact": "low" | "medium" | "high"
       }

    6. Predictions and Forecasting: If applicable, provide:
       - Short-term predictions for the next 3-5 data points
       - Long-term forecast for the next 6-12 months
       - Potential scenarios (best case, worst case, most likely)

    7. Recommendations: Based on the analysis, provide 2-3 actionable recommendations.

    Ensure each section is separated by two newline characters.
  `;

  if (!currentChartData) {
    return basePrompt;
  }

  return `
    ${basePrompt}

    Data to analyze:
    ${JSON.stringify(currentChartData.data, null, 2)}

    Current chart type: ${currentChartData.type}
    Current data keys: ${JSON.stringify(currentChartData.dataKeys)}

    Consider whether the current visualization is the most effective for representing this data,
    or if alternative chart types might provide better insights.
  `;
}

export async function callOpenAI(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: getSystemPrompt() },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        }
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Unexpected API response structure');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

export function parseAIResponse(response: string): ParsedResult {
  try {
    const sections = response.split(/\n{2,}/);
    const summary = sections.find(section => section.trim() !== '') || 'No summary provided';
    const insightsSection = sections.find(section => section.includes('-')) || '';
    const keyInsights = insightsSection
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
    const detailedAnalysisIndex = sections.findIndex(section => section.includes('-')) + 1;
    const detailedAnalysis = sections.slice(detailedAnalysisIndex).join('\n\n').trim();
    
    let chartData: ChartData | null = null;
    const chartDataMatch = response.match(/\{[\s\S]*?"type"[\s\S]*?"data"\s*?:\s*?\[[\s\S]*?\][\s\S]*?"dataKeys"\s*?:\s*?\[[\s\S]*?\][\s\S]*?"title"[\s\S]*?\}/);
    if (chartDataMatch) {
      try {
        const parsedChartData = JSON.parse(chartDataMatch[0]);
        if (
          parsedChartData.type &&
          Array.isArray(parsedChartData.data) &&
          Array.isArray(parsedChartData.dataKeys) &&
          typeof parsedChartData.title === 'string'
        ) {
          chartData = parsedChartData;
          // Handle the new advancedSalesExpenses and other custom chart types
          if (parsedChartData.type === 'advancedSalesExpenses') {
            chartData = {
              ...parsedChartData,
              type: 'multiLine',
              data: parsedChartData.data.map((d: any) => ({
                name: d.month,
                sales: d.sales,
                expenses: d.expenses,
                customers: d.customers,
                profit: d.profit
              })),
              dataKeys: ['name', 'sales', 'expenses', 'customers', 'profit']
            };
          } else if (parsedChartData.type === 'cluster') {
            // Specific processing for cluster chart
            chartData = {
              ...parsedChartData,
              data: parsedChartData.data.map((d: any) => ({
                id: d.id,
                group: d.group,
              })),
              dataKeys: ['id', 'group']
            };
          } else if (parsedChartData.type === 'highlight') {
            // Specific processing for highlight chart
            chartData = {
              ...parsedChartData,
              data: parsedChartData.data.map((d: any) => ({
                name: d.name,
                value: d.value,
                highlight: d.highlight,
              })),
              dataKeys: ['name', 'value', 'highlight']
            };
          } else if (parsedChartData.type === 'trend') {
            // Specific processing for trend chart
            chartData = {
              ...parsedChartData,
              data: parsedChartData.data.map((d: any) => ({
                date: d.date,
                value: d.value,
              })),
              dataKeys: ['date', 'value']
            };
          } else if (parsedChartData.type === 'forecast') {
            // Specific processing for forecast chart
            chartData = {
              ...parsedChartData,
              data: parsedChartData.data.map((d: any) => ({
                date: d.date,
                actual: d.actual,
                forecast: d.forecast,
              })),
              dataKeys: ['date', 'actual', 'forecast']
            };
          }
        } else {
          console.error('Invalid chart data structure:', parsedChartData);
        }
      } catch (e) {
        console.error('Failed to parse chart data:', e);
      }
    } else {
      console.error('No chart data found in the response');
    }

    const insights: AIInsight[] = [];
    const insightsMatch = response.match(/\{[\s\S]*?"type"\s*?:\s*?"(?:trend|anomaly|forecast)"[\s\S]*?"description"[\s\S]*?\}/g);
    if (insightsMatch) {
      insightsMatch.forEach(insightString => {
        try {
          const parsedInsight = JSON.parse(insightString);
          if (
            parsedInsight.type &&
            ['trend', 'anomaly', 'forecast'].includes(parsedInsight.type) &&
            typeof parsedInsight.description === 'string'
          ) {
            insights.push(parsedInsight as AIInsight);
          } else {
            console.error('Invalid insight structure:', parsedInsight);
          }
        } catch (e) {
          console.error('Failed to parse AI insight:', e);
        }
      });
    } else {
      console.error('No insights found in the response');
    }

    return {
      summary,
      keyInsights,
      detailedAnalysis,
      chartData,
      insights,
      mapInsights: [], // Initialize as empty, can be populated for specific contexts
      vmCommand: undefined,
      designSuggestions: undefined,
      suggestedChartType: 'line' as ChartType,
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      summary: 'Failed to parse AI response',
      keyInsights: [],
      detailedAnalysis: response,
      chartData: null,
      insights: [],
      mapInsights: [],
      vmCommand: undefined,
      designSuggestions: undefined,
      suggestedChartType: 'line' as ChartType,
    };
  }
}

export async function performAIAnalysis(
  input: string,
  currentChartData?: ChartData | FinancialChartData,
  contextType: ContextType = 'general'
): Promise<ParsedResult & { vmCommand?: string }> {
  const prompt = generatePrompt(input, currentChartData, contextType);
  const aiResponse = await callOpenAI(prompt);
  const parsedResult = parseAIResponse(aiResponse);



  // Add context-specific processing here if needed
  if (contextType === 'marketing') {
    // Add marketing-specific insights or processing
  } else if (contextType === 'financial') {
    // Add financial-specific insights or processing
  }

  // Generate predictions
  if (currentChartData && currentChartData.data.length > 0) {
    const predictions = generatePredictions(currentChartData);
    parsedResult.predictions = predictions;
  }

  // Generate VM command based on AI analysis
  const vmCommand = generateVMCommand(parsedResult, input);

  return {
    ...parsedResult,
    vmCommand,
  }
}

export function generatePredictions(chartData: ChartData | FinancialChartData): any[] {
  const lastDataPoint = chartData.data[chartData.data.length - 1];
  const predictedData = [];

  for (let i = 1; i <= 3; i++) {
    const newDataPoint: any = { ...lastDataPoint };
    
    // Update the date/time field
    if ('month' in newDataPoint) {
      newDataPoint.month = `Month ${chartData.data.length + i}`;
    } else if ('date' in newDataPoint) {
      const lastDate = new Date(lastDataPoint.date);
      lastDate.setMonth(lastDate.getMonth() + i);
      newDataPoint.date = lastDate.toISOString().split('T')[0];
    }

    // Predict numerical values
    Object.keys(newDataPoint).forEach(key => {
      if (typeof newDataPoint[key] === 'number') {
        // Use exponential smoothing for prediction
        const alpha = 0.3; // Smoothing factor
        const historicalValues = chartData.data.map(d => d[key]).filter(v => typeof v === 'number');
        const prediction = exponentialSmoothing(historicalValues, alpha);
        newDataPoint[key] = Math.round(prediction * 100) / 100; // Round to 2 decimal places
      }
    });

    predictedData.push(newDataPoint);
  }

  return predictedData;
}

export function exponentialSmoothing(data: number[], alpha: number): number {
  let forecast = data[0];
  for (let i = 1; i < data.length; i++) {
    forecast = alpha * data[i] + (1 - alpha) * forecast;
  }
  return forecast;
}

export function generateVMCommand(parsedResult: ParsedResult, input: string): string {
  // Generate a VM command based on the AI analysis
  let vmCommand = '';

  if (parsedResult.keyInsights.length > 0) {
    vmCommand += `echo "Key Insights: ${parsedResult.keyInsights.join(', ')}"`;
  }

  if (parsedResult.chartData) {
    vmCommand += ` && echo "Suggested Chart: ${parsedResult.chartData.title}"`;
  }

  if (parsedResult.insights.length > 0) {
    vmCommand += ` && echo "AI Insights: ${parsedResult.insights.map(insight => JSON.stringify(insight)).join(', ')}"`;
  }

  if (parsedResult.predictions) {
    vmCommand += ` && echo "Predictions: ${parsedResult.predictions.map(prediction => JSON.stringify(prediction)).join(', ')}"`;
  }

  vmCommand += ` && echo "User Query: ${input}"`;

  return vmCommand; // Return the final VM command to execute in the terminal
}
