import React, { useMemo } from 'react';
import { ChartData } from '../types/DataTypes';
import { MapOptions} from '../types/DataTypes';

import {
Bar, BarChart, Brush, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart,
 ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis,
} from 'recharts';
// import MapboxGLComponent from './MapboxGLComponent';
import { ChartType } from '@/types/DataTypes';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];


interface DynamicChartProps {
  chartData: ChartData;
  chartType: ChartType;
  mapOptions: MapOptions;
}

const DynamicChart: React.FC<DynamicChartProps> = ({ chartData }) => {
  const renderChart = () => {
    if (!chartData.dataKeys) {
      return <div>Data keys are not defined</div>;
    }
  
    switch (chartData.type) {
      case 'line':
        return (
          <LineChart data={chartData.data}>
            <XAxis dataKey={chartData.dataKeys[0]} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={chartData.dataKeys[1]} stroke="#8884d8" />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={chartData.data}>
            <XAxis dataKey={chartData.dataKeys[0]} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Bar dataKey={chartData.dataKeys[1]} fill="#8884d8" />
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData.data}
              dataKey={chartData.dataKeys[1]}
              nameKey={chartData.dataKeys[0]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            />
            <Tooltip />
          </PieChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            <XAxis dataKey={chartData.dataKeys[0]} />
            <YAxis dataKey={chartData.dataKeys[1]} />
            <CartesianGrid />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name={chartData.title} data={chartData.data} fill="#8884d8" />
          </ScatterChart>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default DynamicChart;


// import { MapOptions, MapType, DataSource } from '../types/DataTypes';


// interface DynamicChartProps {
//   chartData: ChartData;
//   chartType: ChartType;
//   mapOptions?: MapOptions;
// }
