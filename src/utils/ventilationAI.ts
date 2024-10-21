import axios from 'axios';
import { ChartData } from '../types/DataTypes';
import { getSystemPrompt } from './systemPrompt';

// Type Definitions
type ContextType = 'default' | 'laryngospasm' | 'bronchospasm' | 'hypotension' | 'hypoventilation' | 'airway_obstruction';
type PatientData = { age: number; weight: number; height: number; gender: 'male' | 'female'; };
type VentilatorSettings = { tidalVolume: number; respiratoryRate: number; peep: number; fio2: number; };
type ComplianceData = { time: string; compliance: number; };
type DerivedMeasurement = { name: string; value: number; unit: string; };
type BeliefState = { compliance: number; minuteVentilation: number; a_a_gradient: number; workOfBreathing: number; };
type ParsedResult = { summary: string; keyInsights: string[]; detailedAnalysis: string; chartData?: ChartData | null; beliefUpdate?: Partial<BeliefState>; };

// Utility Functions
const conversionTable: { [key: string]: { [key: string]: number } } = {
  "mL": { "L": 0.001 },
  "L": { "mL": 1000 },
  "cmH2O": { "Pa": 98.0665 },
  "Pa": { "cmH2O": 1 / 98.0665, "mmHg": 1 / 133.322 },
  "mmHg": { "Pa": 133.322 },
  "lb": { "kg": 0.45359237 },
  "kg": { "lb": 1 / 0.45359237 },
  "inch": { "m": 0.0254 },
  "m": { "inch": 1 / 0.0254, "foot": 1 / 0.3048, "yard": 1 / 0.9144 },
  "foot": { "m": 0.3048 },
  "yard": { "m": 0.9144 },
  "mL/min": { "L/min": 0.001 },
  "L/min": { "mL/min": 1000 },
  "mL/cmH2O": { "L/Pa": 1 / 98.0665 },
  "min": { "s": 60 },
  "s": { "min": 1 / 60 },
  "hr": { "min": 60 },
  "day": { "hr": 24 },
  "week": { "day": 7 },
  "dayToWeek": { "week": 1 / 7 },
  "month": { "day": 30.44 },
  "dayToMonth": { "month": 1 / 30.44 },
  "year": { "day": 365.25 },
  "dayToYear": { "year": 1 / 365.25 },
  "mol/L": { "mol/dL": 10 },
  "mol/dL": { "mol/L": 1 / 10 },
  "mg/dL": { "mg/L": 10 },
  "mg/L": { "mg/dL": 1 / 10 },
  "cells/μL": { "cells/L": 1e6 },
  "cells/L": { "cells/μL": 1 / 1e6 },
  "bpm": { "Hz": 1 / 60 },
  "Hz": { "bpm": 60 },
  "mL_O2/min": { "L_O2/min": 0.001 },
  "L_O2/min": { "mL_O2/min": 1000 },
};

const convertToBaseUnits = (value: number, fromUnit: string, toUnit: string): number => {
  if (conversionTable[fromUnit] && conversionTable[fromUnit][toUnit]) {
    return value * conversionTable[fromUnit][toUnit];
  }
  throw new Error(`Conversion from ${fromUnit} to ${toUnit} is not defined.`);
};

// AI Analysis
export async function performLungComplianceAnalysis(
  patientData: PatientData,
  ventilatorSettings: VentilatorSettings,
  scenario: ContextType,
  complianceData: ComplianceData[]
): Promise<DerivedMeasurement[]> {
  const { age, weight, height } = patientData;

  const tidalVolumeL = convertToBaseUnits(ventilatorSettings.tidalVolume, "mL", "L");
  const peepPa = convertToBaseUnits(ventilatorSettings.peep, "cmH2O", "Pa");

  const derivedMeasurements: DerivedMeasurement[] = [];

  if (scenario === 'default' || scenario === 'hypoventilation') {
    const minuteVentilation = tidalVolumeL * ventilatorSettings.respiratoryRate; // L/min
    derivedMeasurements.push({ name: 'Minute Ventilation', value: minuteVentilation, unit: 'L/min' });
  }

  if (scenario === 'laryngospasm') {
    const a_a_gradient = 133.322 * (peepPa - peepPa * 0.9); // Example logic
    derivedMeasurements.push({ name: 'Alveolar-Arterial Gradient', value: a_a_gradient, unit: 'mmHg' });
  }

  if (scenario === 'bronchospasm') {
    const workOfBreathing = peepPa * tidalVolumeL; // J (Joules)
    derivedMeasurements.push({ name: 'Work of Breathing', value: workOfBreathing, unit: 'J' });
  }

  if (scenario === 'hypotension' || scenario === 'airway_obstruction') {
    const compliance = tidalVolumeL / peepPa; // mL/cmH2O (converted to L/Pa)
    derivedMeasurements.push({ name: 'Lung Compliance', value: compliance, unit: 'L/Pa' });
  }

  return derivedMeasurements;
}

// AI and API Integration
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

// Parse AI Response
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
    let beliefUpdate: Partial<BeliefState> | undefined;

    const chartDataMatch = response.match(/\{[\s\S]*?"type"[\s\S]*?"data"\s*?:\s*?\[[\s\S]*?\][\s\S]*?"dataKeys"\s*?:\s*?\[[\s\S]*?\][\s\S]*?"title"[\s\S]*?\}/);
    const beliefUpdateMatch = response.match(/beliefUpdate:\s*\{[\s\S]*?\}/);

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
        } else {
          console.error('Invalid chart data structure:', parsedChartData);
        }
      } catch (e) {
        console.error('Failed to parse chart data:', e);
      }
    } else {
      console.error('No chart data found in the response');
    }

    if (beliefUpdateMatch) {
      try {
        beliefUpdate = JSON.parse(beliefUpdateMatch[0].replace('beliefUpdate:', '').trim());
      } catch (e) {
        console.error('Failed to parse belief state update:', e);
      }
    }

    return {
      summary,
      keyInsights,
      detailedAnalysis,
      chartData,
      beliefUpdate,
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      summary: 'Failed to parse AI response',
      keyInsights: [],
      detailedAnalysis: response,
      chartData: null,
    };
  }
}
