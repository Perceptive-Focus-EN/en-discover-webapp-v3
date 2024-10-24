// src/pages/admin/monitoring.tsx
import React, { useEffect, useState } from 'react';
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
  useTheme
} from '@mui/material';

interface PerformanceMetric {
  endpoint: string;
  averageResponseTime: number;
  errorCount: number;
  requestCount: number;
}

interface SystemHealth {
  totalCpu: number;
  totalMemory: number;
  totalConnections: number;
  healthyServers: number;
}

interface MonitoringDashboardProps {
  onAlertChange?: (hasIssues: boolean) => void;
}

export default function MonitoringDashboard({ onAlertChange }: MonitoringDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[] | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Record dashboard view
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'monitoring',
        'dashboard_view',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { timestamp: new Date().toISOString() }
      );

      try {
        // Get all metrics
        const allMetrics = monitoringManager.metrics.getAllMetrics();
        
        // Process performance metrics
        const performanceMetrics = allMetrics
          .filter(m => m.category === MetricCategory.PERFORMANCE)
          .reduce((acc: PerformanceMetric[], metric) => {
            const existing = acc.find(m => m.endpoint === metric.component);
            if (existing) {
              existing.averageResponseTime = (existing.averageResponseTime + metric.value) / 2;
              existing.requestCount++;
              if (metric.metadata?.error) {
                existing.errorCount++;
              }
            } else {
              acc.push({
                endpoint: metric.component,
                averageResponseTime: metric.value,
                errorCount: metric.metadata?.error ? 1 : 0,
                requestCount: 1
              });
            }
            return acc;
          }, []);

        // Process system health metrics
        const healthMetrics = allMetrics
          .filter(m => m.category === MetricCategory.SYSTEM)
          .reduce((acc: SystemHealth, metric) => {
            switch (metric.component) {
              case 'cpu':
                acc.totalCpu = metric.value;
                break;
              case 'memory':
                acc.totalMemory = metric.value;
                break;
              case 'connections':
                acc.totalConnections = metric.value;
                break;
              case 'servers':
                acc.healthyServers = metric.value;
                break;
            }
            return acc;
          }, {
            totalCpu: 0,
            totalMemory: 0,
            totalConnections: 0,
            healthyServers: 0
          });

        setMetrics(performanceMetrics);
        setSystemHealth(healthMetrics);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'monitoring',
        'dashboard_close',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT
      );
    };
  }, []);

  // Add effect to check and notify about alerts
  useEffect(() => {
    if (onAlertChange && systemHealth && metrics) {
      const hasIssues = 
        systemHealth.totalCpu > 80 || 
        systemHealth.totalMemory > 80 || 
        metrics.some(m => (m.errorCount / m.requestCount) > 0.1);
      
      onAlertChange(hasIssues);
    }
  }, [systemHealth, metrics, onAlertChange]);

  if (loading && !metrics && !systemHealth) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        System Monitoring
      </Typography>
      
      <Grid container spacing={3}>
        {/* System Health */}
        <Grid item xs={12} lg={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Divider sx={{ my: 2 }} />
              {systemHealth && (
                <Box>
                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
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
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
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
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">
                          {systemHealth.totalConnections}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Active Connections
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">
                          {systemHealth.healthyServers}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Healthy Servers
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Performance */}
        <Grid item xs={12} lg={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Performance
              </Typography>
              <Divider sx={{ my: 2 }} />
              {metrics?.map((metric) => (
                <Box key={metric.endpoint} mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    {metric.endpoint}
                  </Typography>
                  
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
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
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
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
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}