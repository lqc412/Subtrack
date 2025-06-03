// src/components/dashboard/SpendingTrends.jsx
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const SpendingTrends = ({ subscriptions, months = 6, viewType = 'line' }) => {
  // Generate trend data for the past N months
  const trendData = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return [];

    const now = new Date();
    const data = [];

    // Generate data for the past N months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      let totalCost = 0;
      let activeCount = 0;
      const categories = {};

      subscriptions.forEach(sub => {
        // Check if subscription was active during this month
        const subStart = new Date(sub.created_at || sub.next_billing_date);
        const subNext = new Date(sub.next_billing_date);
        
        // Simple check: if subscription exists and is active, count it
        // In a real app, you'd want more sophisticated logic based on billing history
        if (sub.is_active && subStart <= date) {
          activeCount++;
          
          const amount = parseFloat(sub.amount) || 0;
          let monthlyCost = 0;

          // Convert to monthly cost
          switch (sub.billing_cycle) {
            case 'monthly':
              monthlyCost = amount;
              break;
            case 'yearly':
              monthlyCost = amount / 12;
              break;
            case 'weekly':
              monthlyCost = amount * 4.33;
              break;
            case 'daily':
              monthlyCost = amount * 30.44;
              break;
            default:
              monthlyCost = amount;
          }

          totalCost += monthlyCost;

          // Track by category
          const category = sub.category || 'Other';
          if (!categories[category]) {
            categories[category] = 0;
          }
          categories[category] += monthlyCost;
        }
      });

      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthShort: date.toLocaleDateString('en-US', { month: 'short' }),
        totalCost: parseFloat(totalCost.toFixed(2)),
        activeCount,
        ...categories // Spread categories as individual properties
      });
    }

    return data;
  }, [subscriptions, months]);

  // Get unique categories for the chart
  const categories = useMemo(() => {
    const catSet = new Set();
    trendData.forEach(month => {
      Object.keys(month).forEach(key => {
        if (!['month', 'monthShort', 'totalCost', 'activeCount'].includes(key)) {
          catSet.add(key);
        }
      });
    });
    return Array.from(catSet);
  }, [trendData]);

  // Colors for different categories
  const categoryColors = {
    'Entertainment': '#8884d8',
    'Productivity': '#82ca9d',
    'Cloud Storage': '#ffc658',
    'Music': '#ff7c7c',
    'Video': '#8dd1e1',
    'Other': '#d084d0',
    'Uncategorized': '#ffb347'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-100 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'totalCost' ? 'Total' : entry.dataKey}: 
              {entry.dataKey === 'activeCount' ? 
                ` ${entry.value} subscriptions` : 
                ` $${entry.value.toFixed(2)}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-base-200 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No trend data available</p>
          <p className="text-sm text-gray-400">Add subscriptions to see spending trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {viewType === 'area' ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="monthShort" 
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Monthly Cost ($)', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Stacked areas for categories */}
            {categories.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={categoryColors[category] || `hsl(${index * 137.5 % 360}, 70%, 50%)`}
                fill={categoryColors[category] || `hsl(${index * 137.5 % 360}, 70%, 50%)`}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="monthShort" 
              fontSize={12}
            />
            <YAxis 
              yAxisId="cost"
              label={{ value: 'Monthly Cost ($)', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <YAxis 
              yAxisId="count"
              orientation="right"
              label={{ value: 'Active Subscriptions', angle: 90, position: 'insideRight' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line 
              yAxisId="cost"
              type="monotone" 
              dataKey="totalCost" 
              stroke="#8884d8" 
              strokeWidth={3}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
              name="Total Cost"
            />
            <Line 
              yAxisId="count"
              type="monotone" 
              dataKey="activeCount" 
              stroke="#82ca9d" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
              name="Active Subscriptions"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {/* Trend summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <p className="text-gray-500">Current Month</p>
          <p className="font-bold text-lg">
            ${trendData[trendData.length - 1]?.totalCost.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Previous Month</p>
          <p className="font-bold text-lg">
            ${trendData[trendData.length - 2]?.totalCost.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Change</p>
          <p className={`font-bold text-lg ${
            (trendData[trendData.length - 1]?.totalCost || 0) > (trendData[trendData.length - 2]?.totalCost || 0) 
              ? 'text-error' : 'text-success'
          }`}>
            {trendData.length >= 2 ? 
              ((trendData[trendData.length - 1]?.totalCost || 0) - (trendData[trendData.length - 2]?.totalCost || 0)).toFixed(2) : 
              '0.00'
            }
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Active Subs</p>
          <p className="font-bold text-lg">
            {trendData[trendData.length - 1]?.activeCount || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpendingTrends;