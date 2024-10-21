import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Fade,
  Tabs,
  Tab,
  Divider,
  Tooltip,
} from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { ParsedResult, AIInsight, AIAnalysisProps } from '../types/AiInsightChart';
import { predefinedPrompts } from '../utils/prompts';
import InsightChips from '../utils/InsightChips';
import { performAIAnalysis } from '../utils/baseAIAnalysis';

const AIAnalysis: React.FC<AIAnalysisProps> = ({ currentChartData, onChartUpdate, contextType }) => {
  const [state, setState] = useState<{
    input: string;
    aiResult: ParsedResult | null;
    isLoading: boolean;
  }>({
    input: '',
    aiResult: null,
    isLoading: false,
  });
  
  const performAnalysis = useCallback(async (prompt: string = state.input) => {
    setState((prevState) => ({ ...prevState, isLoading: true }));
    try {
      const result = await performAIAnalysis(prompt, currentChartData, contextType);
      setState((prevState) => ({ ...prevState, aiResult: result, isLoading: false }));

      if (result.chartData) {
        onChartUpdate(result.chartData);
      }
    } catch (error) {
      console.error('Error in AI analysis:', error);
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  }, [state.input, currentChartData, contextType, onChartUpdate]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({ ...prevState, input: e.target.value }));
  }, []);

  const handleTabChange = useCallback((_e: React.SyntheticEvent, newValue: number) => {
    setState((prevState) => ({
      ...prevState,
      input: predefinedPrompts[newValue] || '',
    }));
  }, []);

  const renderInsight = (insight: AIInsight): string => {
    return `${insight.type}: ${insight.description}${insight.confidence ? ` (Confidence: ${insight.confidence})` : ''}${insight.impact ? ` (Impact: ${insight.impact})` : ''}`;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs
        value={predefinedPrompts.indexOf(state.input)}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="AI Insight Tabs"
      >
        {predefinedPrompts.map((prompt, index) => (
          <Tab
            key={index}
            label={
              <Tooltip title={prompt}>
                <span>{prompt.length > 20 ? `${prompt.slice(0, 20)}...` : prompt}</span>
              </Tooltip>
            }
          />
        ))}
      </Tabs>
      <Divider sx={{ my: 2 }} />

      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          value={state.input}
          onChange={handleInputChange}
          placeholder="Ask a custom question or select a predefined prompt above"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => performAnalysis()}
          disabled={state.isLoading}
          startIcon={state.isLoading ? <CircularProgress size={20} /> : <Lightbulb />}
        >
          {state.isLoading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </Paper>

      {state.aiResult && (
        <Fade in={true}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>AI Analysis Results</Typography>
            <Typography variant="subtitle1" gutterBottom>Summary</Typography>
            <Typography variant="body2" paragraph>{state.aiResult.summary}</Typography>
            
            {state.aiResult.insights && state.aiResult.insights.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>AI-Generated Insights</Typography>
                <Box sx={{ mb: 2 }}>
                  <InsightChips insights={state.aiResult.insights.map(renderInsight)} />
                </Box>
                {state.aiResult.insights.map((insight, index) => (
                  <Typography key={index} variant="body2">{renderInsight(insight)}</Typography>
                ))}
              </>
            )}
            
            {state.aiResult.detailedAnalysis && (
              <>
                <Typography variant="subtitle1" gutterBottom>Detailed Analysis</Typography>
                <Typography variant="body2" paragraph>{state.aiResult.detailedAnalysis}</Typography>
              </>
            )}
            
            {state.aiResult.predictions && state.aiResult.predictions.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>Predictions</Typography>
                {state.aiResult.predictions.map((prediction, index) => (
                  <Typography key={index} variant="body2">{JSON.stringify(prediction)}</Typography>
                ))}
              </>
            )}
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default AIAnalysis;
