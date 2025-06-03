// src/components/dashboard/CategoryChart.jsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const CategoryChart = ({ subscriptions, viewType = 'pie' }) => {
  // Define colors for different categories
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
    '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
  ];

  // Calculate category data from subscriptions
  const categoryData = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return [];

    const categoryStats = {};

    subscriptions.forEach(subscription => {
      // Only include active subscriptions
      if (!subscription.is_active) return;

      const category = subscription.category || 'Uncategorized';
      const amount = parseFloat(subscription.amount) || 0;

      // Convert all amounts to monthly cost for consistent comparison
      let monthlyCost = 0;
      switch (subscription.billing_cycle) {
        case 'monthly':
          monthlyCost = amount;
          break;
        case 'yearly':
          monthlyCost = amount / 12;
          break;
        case 'weekly':
          monthlyCost = amount * 4.33; // Average weeks per month
          break;
        case 'daily':
          monthlyCost = amount * 30.44; // Average days per month
          break;
        default:
          monthlyCost = amount; // Default to monthly
      }

      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          value: 0,
          count: 0,
          subscriptions: []
        };
      }

      categoryStats[category].value += monthlyCost;
      categoryStats[category].count += 1;
      categoryStats[category].subscriptions.push(subscription.company);
    });

    // Convert to array and sort by value
    return Object.values(categoryStats)
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length],
        percentage: 0 // Will be calculated after we have total
      }))
      .map((item, index, array) => {
        const total = array.reduce((sum, cat) => sum + cat.value, 0);
        return {
          ...item,
          percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
        };
      });
  }, [subscriptions]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-base-100 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{data.name}</p>
          <p className="text-primary">
            Monthly Cost: ${data.value.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            {data.count} subscription{data.count !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-gray-600">
            {data.percentage}% of total
          </p>
          {data.subscriptions && data.subscriptions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium">Services:</p>
              <p className="text-xs text-gray-500">
                {data.subscriptions.slice(0, 3).join(', ')}
                {data.subscriptions.length > 3 && ` +${data.subscriptions.length - 3} more`}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-base-200 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No subscription data available</p>
          <p className="text-sm text-gray-400">Add some subscriptions to see category breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {viewType === 'pie' ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value} (${entry.payload.value.toFixed(2)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Monthly Cost ($)', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryChart;