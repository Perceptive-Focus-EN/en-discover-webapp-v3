import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types/DataTypes';

const ForecastChart: React.FC<{ data: DataPoint[], forecastData: DataPoint[] }> = ({ data, forecastData }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data.concat(forecastData)}>
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sales" stroke="#8884d8" />
        <Line type="monotone" dataKey="expenses" stroke="#82ca9d" />
        {/* Add forecast line with a different style */}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart;
