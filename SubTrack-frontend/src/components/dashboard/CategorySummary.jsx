// src/components/dashboard/CategorySummary.jsx
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CompanyLogo from '../CompanyLogo';

const CategorySummary = ({ subscriptions, limit = 5 }) => {
  // Calculate category statistics
  const categoryStats = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return [];

    const stats = {};

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
          monthlyCost = amount * 4.33;
          break;
        case 'daily':
          monthlyCost = amount * 30.44;
          break;
        default:
          monthlyCost = amount;
      }

      if (!stats[category]) {
        stats[category] = {
          name: category,
          totalCost: 0,
          count: 0,
          services: [],
          avgCost: 0,
          highestCost: 0,
          lowestCost: Infinity
        };
      }

      stats[category].totalCost += monthlyCost;
      stats[category].count += 1;
      stats[category].services.push({
        name: subscription.company,
        cost: monthlyCost,
        billing_cycle: subscription.billing_cycle
      });

      // Update min/max costs
      if (monthlyCost > stats[category].highestCost) {
        stats[category].highestCost = monthlyCost;
      }
      if (monthlyCost < stats[category].lowestCost) {
        stats[category].lowestCost = monthlyCost;
      }
    });

    // Calculate averages and sort
    return Object.values(stats)
      .map(cat => ({
        ...cat,
        avgCost: cat.totalCost / cat.count,
        lowestCost: cat.lowestCost === Infinity ? 0 : cat.lowestCost,
        services: cat.services.sort((a, b) => b.cost - a.cost) // Sort services by cost
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }, [subscriptions, limit]);

  // Calculate total monthly spending
  const totalMonthly = useMemo(() => {
    return categoryStats.reduce((sum, cat) => sum + cat.totalCost, 0);
  }, [categoryStats]);

  // Get trend indicator (placeholder - you could implement actual trend calculation)
  const getTrendIndicator = (category) => {
    // This is a placeholder - in a real app, you'd compare with previous period
    const changePercent = Math.random() * 20 - 10; // Random between -10 and 10
    
    if (changePercent > 2) {
      return { icon: TrendingUp, color: 'text-error', text: `+${changePercent.toFixed(1)}%` };
    } else if (changePercent < -2) {
      return { icon: TrendingDown, color: 'text-success', text: `${changePercent.toFixed(1)}%` };
    } else {
      return { icon: Minus, color: 'text-gray-400', text: '0%' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (categoryStats.length === 0) {
    return (
      <div className="bg-base-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">No category data available</p>
        <p className="text-sm text-gray-400 mt-1">Add subscriptions with categories to see breakdown</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with total */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Top Categories</h3>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Monthly</p>
          <p className="font-bold text-lg">{formatCurrency(totalMonthly)}</p>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-3">
        {categoryStats.map((category, index) => {
          const trend = getTrendIndicator(category);
          const TrendIcon = trend.icon;
          const percentage = totalMonthly > 0 ? (category.totalCost / totalMonthly * 100) : 0;

          return (
            <div key={category.name} className="bg-base-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg capitalize">{category.name}</span>
                    <span className="badge badge-outline badge-sm">{category.count}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon size={16} className={trend.color} />
                    <span className={`text-sm ${trend.color}`}>{trend.text}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(category.totalCost)}</p>
                  <p className="text-sm text-gray-500">{percentage.toFixed(1)}% of total</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-base-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Category details */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Average</p>
                  <p className="font-medium">{formatCurrency(category.avgCost)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Highest</p>
                  <p className="font-medium">{formatCurrency(category.highestCost)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lowest</p>
                  <p className="font-medium">{formatCurrency(category.lowestCost)}</p>
                </div>
              </div>

              {/* Top services in category */}
              {category.services.length > 0 && (
                <div className="mt-3 pt-3 border-t border-base-200">
                  <p className="text-sm text-gray-500 mb-2">Top Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.services.slice(0, 3).map((service, serviceIndex) => (
                      <div key={serviceIndex} className="flex items-center gap-1 bg-base-200 rounded-full px-2 py-1">
                        <CompanyLogo company={service.name} size="small" />
                        <span className="text-xs font-medium">{service.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(service.cost)}
                        </span>
                      </div>
                    ))}
                    {category.services.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{category.services.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show all categories link */}
      {categoryStats.length >= limit && (
        <div className="text-center">
          <button className="btn btn-outline btn-sm">
            View All Categories
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySummary;