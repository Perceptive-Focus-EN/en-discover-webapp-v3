import React, { useEffect, useState, useCallback } from 'react';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Grid,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  CardHeader,
  Avatar
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import ComputerIcon from '@mui/icons-material/Computer';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface PerformanceMetric {
  endpoint: string;
  averageResponseTime: number;
  errorCount: number;
  requestCount: number;
  metadata?: {
    uploadStats?: {
      queueSize?: number;
      chunkProgress?: number;
      memoryUsage?: number;
    };
  };
}

interface SystemHealth {
  totalCpu: number;
  totalMemory: number;
  totalConnections: number;
  healthyServers: number;
}

interface MonitoringErrorBoundaryProps {
  children: React.ReactNode;
}

interface MonitoringDashboardProps {
  onAlertChange?: (hasIssues: boolean) => void;
}

function isSystemHealthMetric(metric: any): metric is SystemHealth {
  return (
    metric &&
    typeof metric.totalCpu === 'number' &&
    typeof metric.totalMemory === 'number' &&
    typeof metric.totalConnections === 'number' &&
    typeof metric.healthyServers === 'number'
  );
}

function isPerformanceMetric(metric: any): metric is PerformanceMetric {
  return (
    metric &&
    typeof metric.averageResponseTime === 'number' &&
    typeof metric.errorCount === 'number' &&
    typeof metric.requestCount === 'number'
  );
}

class MonitoringErrorBoundary extends React.Component<MonitoringErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'monitoring',
      'dashboard_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { error, errorInfo }
    );
  }

  render() {
    if (this.state.hasError) {
      return <Box>Error loading monitoring dashboard. Please try again later.</Box>;
    }
    return this.props.children;
  }
}

export default function MonitoringDashboard({ onAlertChange }: MonitoringDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[] | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allMetrics = monitoringManager.metrics.getAllMetrics();

      // Get only processed metrics
      const dashboardMetrics = allMetrics.filter(
        metric => metric.metadata?.isDashboardMetric && metric.metadata?.isProcessed
      );

      // Process System Health Metrics
      const healthMetrics = {
        totalCpu: 0,
        totalMemory: 0,
        totalConnections: 0,
        healthyServers: 0
      };

      // Get latest values for system health
      dashboardMetrics
        .filter(m => m.category === MetricCategory.SYSTEM)
        .forEach(metric => {
          if (metric.metadata?.isProcessed) {
            switch (metric.metadata.component) {
              case 'cpu':
                healthMetrics.totalCpu = metric.value;
                break;
              case 'memory':
                healthMetrics.totalMemory = metric.value;
                break;
              case 'connections':
                healthMetrics.totalConnections = metric.value;
                break;
              case 'servers':
                healthMetrics.healthyServers = metric.value;
                break;
            }
          }
        });

      // Process Performance Metrics
      const performanceMetricsMap = new Map<string, PerformanceMetric>();

      dashboardMetrics
        .filter(m => m.category === MetricCategory.PERFORMANCE)
        .forEach(metric => {
          if (!metric.metadata?.isProcessed) return;

          const endpoint = metric.metadata.component as string;
          let perfMetric = performanceMetricsMap.get(endpoint);

          if (!perfMetric) {
            perfMetric = {
              endpoint,
              averageResponseTime: 0,
              errorCount: 0,
              requestCount: 0
            };
            performanceMetricsMap.set(endpoint, perfMetric);
          }

          if (metric.metadata.category === 'response_time') {
            perfMetric.averageResponseTime = metric.value;
            perfMetric.requestCount++;
          } else if (metric.metadata.category === 'error_count') {
            perfMetric.errorCount = metric.value;
          }
        });

      setSystemHealth(healthMetrics);
      setMetrics(Array.from(performanceMetricsMap.values()));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Add metric recording for dashboard view
  useEffect(() => {
    monitoringManager.recordDashboardMetric({
      type: 'SYSTEM_HEALTH',
      timestamp: Date.now(),
      value: 1,
      metadata: {
        component: 'dashboard',
        category: 'view',
        aggregationType: 'sum'
      }
    });

    return () => {
      monitoringManager.recordDashboardMetric({
        type: 'SYSTEM_HEALTH',
        timestamp: Date.now(),
        value: 0,
        metadata: {
          component: 'dashboard',
          category: 'view',
          aggregationType: 'latest'
        }
      });
    };
  }, []);
  
  useEffect(() => {
    if (onAlertChange && systemHealth && metrics) {
      const hasIssues = 
        systemHealth.totalCpu > 80 || 
        systemHealth.totalMemory > 80 || 
        metrics.some(m => (m.errorCount / m.requestCount) > 0.1);
      
      onAlertChange(hasIssues);
    }
  }, [systemHealth, metrics, onAlertChange]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!metrics?.length && !systemHealth) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>No data available.</Typography>
      </Box>
    );
  }

  return (
    <MonitoringErrorBoundary>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ typography: { xs: 'h6', sm: 'h5', md: 'h4' } }}>
          System Monitoring
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                avatar={<ComputerIcon />}
                title="System Health"
                titleTypographyProps={{ variant: 'h6', sx: { typography: { xs: 'body1', sm: 'h6' } } }}
              />
              <CardContent>
                <Divider />
                {systemHealth && isSystemHealthMetric(systemHealth) ? (
                  <Box>
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          CPU Usage
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {systemHealth.totalCpu.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={systemHealth.totalCpu}
                        color={systemHealth.totalCpu > 80 ? 'error' : 'primary'}
                      />
                    </Box>

                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Memory Usage
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {systemHealth.totalMemory.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={systemHealth.totalMemory}
                        color={systemHealth.totalMemory > 80 ? 'error' : 'primary'}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper>
                          <Box p={2}>
                            <Typography variant="h6" sx={{ typography: { xs: 'body1', sm: 'h6' } }}>
                              {systemHealth.totalConnections}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Active Connections
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper>
                          <Box p={2}>
                            <Typography variant="h6" sx={{ typography: { xs: 'body1', sm: 'h6' } }}>
                              {systemHealth.healthyServers}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Healthy Servers
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Typography>No system health data available.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                avatar={<StorageIcon />}
                title="API Performance"
                titleTypographyProps={{ variant: 'h6', sx: { typography: { xs: 'body1', sm: 'h6' } } }}
              />
              <CardContent>
                <Divider />
                {metrics?.length ? (
                  metrics.map((metric) => isPerformanceMetric(metric) && (
                    <Box key={metric.endpoint} mb={2}>
                      <Typography variant="subtitle2" gutterBottom sx={{ typography: { xs: 'body2', sm: 'subtitle2' } }}>
                        {metric.endpoint}
                      </Typography>

                      <Box mb={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Response Time
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {metric.averageResponseTime.toFixed(2)}ms
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((metric.averageResponseTime / 1000) * 100, 100)}
                        />
                      </Box>

                      <Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Error Rate
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {((metric.errorCount / metric.requestCount) * 100).toFixed(2)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(metric.errorCount / metric.requestCount) * 100}
                          color="error"
                        />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography>No performance metrics available.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                avatar={<CloudUploadIcon />}
                title="Active Uploads"
                subheader="Real-time upload monitoring"
              />
              <CardContent>
                {metrics?.filter(m => 
                  m.endpoint === 'upload_system' && 
                  m.requestCount > 0
                ).map((metric, index) => (
                  <Box key={index} mb={2}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">
                          Active Uploads: {metric.requestCount || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">
                          Queue Size: {metric.metadata?.uploadStats?.queueSize || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box mt={1}>
                      <Typography variant="body2" color="textSecondary">
                        Upload Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={metric.metadata?.uploadStats?.chunkProgress || 0}
                        sx={{
                          height: 8,
                          borderRadius: 5,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5
                          }
                        }}
                      />
                    </Box>

                    <Box mt={1}>
                      <Typography variant="body2" color="textSecondary">
                        Memory Usage
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={((metric.metadata?.uploadStats?.memoryUsage || 0) / 1024 / 1024 / 1024) * 100}
                        color={(metric.metadata?.uploadStats?.memoryUsage ?? 0) > 1024 * 1024 * 1024 ? "warning" : "primary"}
                      />
                      <Typography variant="caption">
                        {Math.round((metric.metadata?.uploadStats?.memoryUsage || 0) / 1024 / 1024)}MB
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MonitoringErrorBoundary>
  );
}
