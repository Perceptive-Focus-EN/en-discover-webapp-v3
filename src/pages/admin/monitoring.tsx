import React, { useEffect, useState } from 'react';
import { apiMonitoring } from '../../utils/Monitoring/ApiMonitoring';

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const performanceMetrics = await apiMonitoring.getPerformanceMetrics();
      const health = await apiMonitoring.getSystemHealth();
      
      setMetrics(performanceMetrics);
      setSystemHealth(health);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>System Monitoring</h1>
      
      {/* Performance Metrics */}
      <section>
        <h2>API Performance</h2>
        {metrics && metrics.map((metric: any) => (
          <div key={metric.endpoint}>
            <h3>{metric.endpoint}</h3>
            <p>Average Response Time: {metric.averageResponseTime}ms</p>
            <p>Error Rate: {metric.errorCount / metric.requestCount * 100}%</p>
          </div>
        ))}
      </section>

      {/* System Health */}
      <section>
        <h2>System Health</h2>
        {systemHealth && (
          <>
            <p>CPU Usage: {systemHealth.totalCpu}%</p>
            <p>Memory Usage: {systemHealth.totalMemory}%</p>
            <p>Total Connections: {systemHealth.totalConnections}</p>
            <p>Healthy Servers: {systemHealth.healthyServers}</p>
          </>
        )}
      </section>
    </div>
  );
}