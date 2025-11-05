import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type  { ChartData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface RevenueChartProps {
  data: ChartData[];
  type: 'line' | 'bar';
  title: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, type, title }) => {
  const { theme } = useTheme();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className={`rounded-xl shadow-sm border p-6 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#6B7280' : '#374151'} />
              <YAxis tickFormatter={formatCurrency} stroke={theme === 'dark' ? '#6B7280' : '#374151'} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#F9FAFB' : '#1F2937'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#7A34D6" 
                strokeWidth={3}
                dot={{ fill: '#7A34D6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#5C1DB1' }}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#6B7280' : '#374151'} />
              <YAxis tickFormatter={formatCurrency} stroke={theme === 'dark' ? '#6B7280' : '#374151'} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#F9FAFB' : '#1F2937'
                }}
              />
              <Bar dataKey="revenue" fill="#7A34D6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;