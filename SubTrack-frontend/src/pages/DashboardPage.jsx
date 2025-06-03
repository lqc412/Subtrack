import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, TrendingUp, ArrowRight, BarChart3, PieChart } from 'lucide-react';
import api from '../services/api';
import CategoryChart from '../components/dashboard/CategoryChart';
import CategorySummary from '../components/dashboard/CategorySummary';

export default function DashboardPage() {
  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/subs').then(res => res.data)
  });
  
  const [stats, setStats] = useState({
    totalMonthly: 0,
    totalYearly: 0,
    upcomingPayments: [],
    activeSubscriptions: 0,
    totalCategories: 0
  });
  
  // State for chart view toggle
  const [chartView, setChartView] = useState('pie'); // 'pie' or 'bar'
  
  useEffect(() => {
    if (subscriptions) {
      // Calculate total costs
      let monthly = 0;
      let yearly = 0;
      let activeCount = 0;
      const categories = new Set();
      
      subscriptions.forEach(sub => {
        if (!sub.is_active) return;
        
        activeCount++;
        const amount = parseFloat(sub.amount);
        
        // Add category to set
        if (sub.category) {
          categories.add(sub.category);
        }
        
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
        upcomingPayments: upcoming,
        activeSubscriptions: activeCount,
        totalCategories: categories.size
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Active Subscriptions</div>
          <div className="stat-value">{stats.activeSubscriptions}</div>
          <div className="stat-desc">Currently paying for</div>
        </div>
        
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Categories</div>
          <div className="stat-value">{stats.totalCategories}</div>
          <div className="stat-desc">Different service types</div>
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
            <CalendarDays size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No upcoming payments in the next 30 days</p>
            <p className="text-sm">All caught up! Your next payments are further out.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Days Until</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingPayments.map((payment) => {
                  const daysUntil = Math.ceil((new Date(payment.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={payment.id}>
                      <td className="font-medium">{payment.company}</td>
                      <td>{formatDate(payment.next_billing_date)}</td>
                      <td className="font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td>
                        <span className={`badge ${daysUntil <= 3 ? 'badge-error' : daysUntil <= 7 ? 'badge-warning' : 'badge-success'}`}>
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
          <div className="flex gap-2">
            <button 
              className={`btn btn-sm ${chartView === 'pie' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setChartView('pie')}
              title="Pie Chart View"
            >
              <PieChart size={16} />
            </button>
            <button 
              className={`btn btn-sm ${chartView === 'bar' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setChartView('bar')}
              title="Bar Chart View"
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
        
        {!subscriptions || subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No subscriptions found</p>
            <p className="text-sm">Add some subscriptions to see category breakdown</p>
            <Link to="/subscriptions" className="btn btn-primary btn-sm mt-4">
              Add Subscription
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="flex flex-col">
              <h3 className="font-semibold mb-3">
                {chartView === 'pie' ? 'Distribution' : 'Spending by Category'}
              </h3>
              <CategoryChart subscriptions={subscriptions} viewType={chartView} />
            </div>
            
            {/* Category Summary */}
            <div className="flex flex-col">
              <CategorySummary subscriptions={subscriptions} limit={5} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}