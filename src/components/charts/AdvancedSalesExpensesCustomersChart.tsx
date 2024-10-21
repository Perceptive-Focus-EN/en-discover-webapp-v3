import React, { useMemo } from 'react';
import * as d3 from 'd3';
import {
    ComposedChart,
    Line,
    Bar,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Area,
} from 'recharts';
import { Typography, Box, Paper, Theme } from '@mui/material';
import { ResponsiveStyleValue } from '@mui/system/styleFunctionSx';
import { Property } from 'csstype';

export type DataPoint = {
    month?: string;
    sales?: number;
    expenses?: number;
    customers?: number;
    profit?: number;
    value?: number;
    group?: number;     // For clustering charts
    [key: string]: any;
};


type AdvancedSalesExpensesCustomersChartProps = {
    data: DataPoint[];
};

type CustomTooltipProps = {
    active?: boolean;
    payload?: any;
    label?: string;
};

const AdvancedSalesExpensesCustomersChart: React.FC<AdvancedSalesExpensesCustomersChartProps> = ({
    data,
}) => {
    const convergencePoint = useMemo(() => {
        return data.reduce(
            (closest, point, index) => {
                const diff = Math.abs((point.sales ?? 0) - (point.expenses ?? 0));
                if (diff < closest.diff) {
                    return { diff, index };
                }
                return closest;
            },
            { diff: Infinity, index: -1 }
        );
    }, [data]);

    const correlations = useMemo(() => {
        return {
            salesCustomers: calculateCorrelation(data, 'sales', 'customers'),
            expensesCustomers: calculateCorrelation(data, 'expenses', 'customers'),
        };
    }, [data]);

    return (
        <Box sx={{ width: '100%', height: 500, mt: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
                Sales vs Expenses vs Customers Analysis
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                        yAxisId="left"
                        label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Customers', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        stroke="#8884d8"
                        name="Sales"
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="expenses"
                        stroke="#82ca9d"
                        name="Expenses"
                    />
                    <Bar
                        yAxisId="right"
                        dataKey="customers"
                        fill="#ffc658"
                        name="Customers"
                    />
                    <Area
                        yAxisId="left"
                        dataKey="profit"
                        fill="#8884d8"
                        stroke="#8884d8"
                        fillOpacity={0.3}
                        name="Profit"
                    />

                    {convergencePoint.index !== -1 && (
                        <ReferenceLine
                            x={data[convergencePoint.index].month}
                            stroke="red"
                            strokeDasharray="3 3"
                            label={{ value: 'Convergence', position: 'top' }}
                        />
                    )}

                    <Scatter
                        yAxisId="left"
                        dataKey="sales"
                        fill="none"
                        shape={(props: any) =>
                            renderCorrelationIndicator(
                                props,
                                correlations.salesCustomers,
                                '#8884d8'
                            )
                        }
                    />
                    <Scatter
                        yAxisId="left"
                        dataKey="expenses"
                        fill="none"
                        shape={(props: any) =>
                            renderCorrelationIndicator(
                                props,
                                correlations.expensesCustomers,
                                '#82ca9d'
                            )
                        }
                    />
                </ComposedChart>
            </ResponsiveContainer>
            <CorrelationLegend
                salesCorrelation={correlations.salesCustomers}
                expensesCorrelation={correlations.expensesCustomers}
            />
        </Box>
    );
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
}) => {
    if (active && payload && payload.length) {
        return (
            <Paper elevation={3} sx={{ p: 1 }}>
                <Typography variant="body2">{`Month: ${label}`}</Typography>
                {payload.map((entry: { color: string | (string & {}) | readonly string[] | readonly (Property.Color | readonly string[] | null | undefined)[] | { [key: string]: Property.Color | readonly string[] | null | undefined; } | ((theme: Theme) => ResponsiveStyleValue<Property.Color | readonly string[] | undefined>) | undefined; name: any; value: any; }, index: React.Key | null | undefined) => (
                    <Typography key={index} variant="body2" color={entry.color}>
                        {`${entry.name}: ${entry.value}`}
                    </Typography>
                ))}
            </Paper>
        );
    }
    return null;
};

const renderCorrelationIndicator = (
    props: any,
    correlation: number,
    color: string
) => {
    const { cx, cy } = props;
    const size = Math.abs(correlation) * 20;
    return <circle cx={cx} cy={cy} r={size} stroke={color} strokeWidth={2} fill="none" />;
};

type CorrelationLegendProps = {
    salesCorrelation: number;
    expensesCorrelation: number;
};

const CorrelationLegend: React.FC<CorrelationLegendProps> = ({
    salesCorrelation,
    expensesCorrelation,
}) => (
    <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Correlation with Customers:</Typography>
        <Typography variant="body2" color="#8884d8">
            Sales: {salesCorrelation.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="#82ca9d">
            Expenses: {expensesCorrelation.toFixed(2)}
        </Typography>
    </Box>
);

const calculateCorrelation = (
    data: DataPoint[],
    key1: keyof DataPoint,
    key2: keyof DataPoint
): number => {
    const n = data.length;
    let sum1 = 0,
        sum2 = 0,
        sum1Sq = 0,
        sum2Sq = 0,
        pSum = 0;

    for (let i = 0; i < n; i++) {
        sum1 += Number(data[i][key1]);
        sum2 += Number(data[i][key2]);
        sum1Sq += Number(data[i][key1]) ** 2;
        sum2Sq += Number(data[i][key2]) ** 2;
        pSum += Number(data[i][key1]) * Number(data[i][key2]);
    }

    const num = pSum - (sum1 * sum2) / n;
    const den = Math.sqrt(
        (sum1Sq - (sum1 ** 2) / n) * (sum2Sq - (sum2 ** 2) / n)
    );

    return num / den;
};

export default AdvancedSalesExpensesCustomersChart;
