import { CustomChartProps } from '../../types/DataTypes';

export const validateData = (data: CustomChartProps['data']) => {
  if (!data || data.length === 0) {
    throw new Error('Data is required for chart rendering.');
  }
  if (!data[0].month || !data[0].sales || !data[0].expenses) {
    throw new Error('Data format is incorrect.');
  }
};
