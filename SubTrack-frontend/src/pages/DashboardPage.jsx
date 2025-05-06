import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function DashboardPage() {
  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/subs').then(res => res.data)
  });
  
  const [stats, setStats] = useState({
    totalMonthly: 0,
    totalYearly: 0,
    upcomingPayments: []
  });
  
  useEffect(() => {
    if (subscriptions) {
      // Calculate total costs
      let monthly = 0;
      let yearly = 0;
      
      subscriptions.forEach(sub => {
        if (!sub.is_active) return;
        
        const amount = parseFloat(sub.amount);
        
        switch(sub.billing_cycle) {
          case 'monthly':
            monthly += amount;
            yearly += amount * 12;
            break;
          case 'yearly':
            monthly += amount / 12;
            yearly += amount;
            break;
          case 'weekly':
            monthly += amount * 4.33; // Approximate weeks per month
            yearly += amount * 52;
            break;
          case 'daily':
            monthly += amount * 30.44; // Approximate days per month
            yearly += amount * 365;
            break;
        }
      });
      
      // Get upcoming payments (next 30 days)
      const today = new Date();
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);
      
      const upcoming = subscriptions
        .filter(sub => sub.is_active && new Date(sub.next_billing_date) <= next30Days)
        .sort((a, b) => new Date(a.next_billing_date) - new Date(b.next_billing_date))
        .slice(0, 5); // Top 5 upcoming
      
      setStats({
        totalMonthly: monthly.toFixed(2),
        totalYearly: yearly.toFixed(2),
        upcomingPayments: upcoming
      });
    }
  }, [subscriptions]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (error) {
    return <div className="alert alert-error">Error loading data</div>;
  }
  
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Total Monthly Cost</div>
          <div className="stat-value text-primary">{formatCurrency(stats.totalMonthly)}</div>
          <div className="stat-desc">All active subscriptions</div>
        </div>
        
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Annual Spending</div>
          <div className="stat-value">{formatCurrency(stats.totalYearly)}</div>
          <div className="stat-desc">Projected yearly total</div>
        </div>
      </div>
      
      {/* Upcoming Payments */}
      <div className="bg-base-100 shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" />
            Upcoming Payments
          </h2>
          <Link to="/subscriptions" className="text-sm text-primary flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        
        {stats.upcomingPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upcoming payments in the next 30 days
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-medium">{payment.company}</td>
                    <td>{formatDate(payment.next_billing_date)}</td>
                    <td className="font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Subscription Categories */}
      <div className="bg-base-100 shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Subscription Categories
          </h2>
        </div>
        
        {!subscriptions || subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No subscriptions found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category distribution chart could go here */}
            <div className="h-64 flex items-center justify-center bg-base-200 rounded-lg">
              <p className="text-gray-500">Category distribution chart</p>
            </div>
            
            {/* Top categories list */}
            <div className="space-y-4">
              <h3 className="font-bold">Top Categories</h3>
              {Object.entries(getCategoryCosts(subscriptions))
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="capitalize">{category || 'Uncategorized'}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate costs by category
function getCategoryCosts(subscriptions) {
  const categoryCosts = {};
  
  subscriptions.forEach(sub => {
    if (!sub.is_active) return;
    
    const category = sub.category || 'Uncategorized';
    const amount = parseFloat(sub.amount);
    
    if (!categoryCosts[category]) {
      categoryCosts[category] = 0;
    }
    
    // Convert all to monthly cost for comparison
    let monthlyCost = 0;
    switch(sub.billing_cycle) {
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
    }
    
    categoryCosts[category] += monthlyCost;
  });
  
  return categoryCosts;
}