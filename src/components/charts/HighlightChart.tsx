import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types/DataTypes';

interface HighlightChartProps {
  data: DataPoint[];
}

const HighlightChart: React.FC<HighlightChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available for the Highlight Chart</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        {data[0].sales !== undefined && (
          <Line type="monotone" dataKey="sales" stroke="#8884d8" />
        )}
        {data[0].expenses !== undefined && (
          <Line type="monotone" dataKey="expenses" stroke="#82ca9d" />
        )}
        {/* Add custom highlights or annotations */}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default HighlightChart;