import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import CompanyLogo from '../CompanyLogo';

export default function SubscriptionMatcher({ newSubscriptions }) {
  const [selectedSubscriptions, setSelectedSubscriptions] = useState(
    newSubscriptions.map(sub => ({ ...sub, selected: true }))
  );
  
  const queryClient = useQueryClient();
  
  // 导入选中的订阅
  const importMutation = useMutation({
    mutationFn: (subs) => api.post('/subs/batch', { subscriptions: subs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
  
  const handleToggleSubscription = (index) => {
    setSelectedSubscriptions(prev => {
      const updated = [...prev];
      updated[index].selected = !updated[index].selected;
      return updated;
    });
  };
  
  const handleImportSelected = async () => {
    const selectedSubs = selectedSubscriptions.filter(sub => sub.selected);
    if (selectedSubs.length === 0) return;
    
    try {
      await importMutation.mutateAsync(selectedSubs);
    } catch (error) {
      console.error('Error importing subscriptions:', error);
    }
  };
  
  // 编辑订阅详情
  const handleEditSubscription = (index, field, value) => {
    setSelectedSubscriptions(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };
  
  // 格式化日期显示
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // 格式化金额显示
  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Review Detected Subscriptions</h2>
      
      {selectedSubscriptions.length === 0 ? (
        <div className="alert alert-info">
          <span>No subscriptions were detected in your emails.</span>
        </div>
      ) : (
        <>
          <p className="mb-4">
            We found {selectedSubscriptions.length} potential subscriptions. 
            Please review and confirm the details before importing.
          </p>
          
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      className="checkbox" 
                      checked={selectedSubscriptions.every(sub => sub.selected)}
                      onChange={() => {
                        const allSelected = selectedSubscriptions.every(sub => sub.selected);
                        setSelectedSubscriptions(prev => 
                          prev.map(sub => ({ ...sub, selected: !allSelected }))
                        );
                      }}
                    />
                  </th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Billing Cycle</th>
                  <th>Next Billing</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedSubscriptions.map((subscription, index) => (
                  <tr key={index} className={subscription.selected ? '' : 'opacity-50'}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="checkbox" 
                        checked={subscription.selected}
                        onChange={() => handleToggleSubscription(index)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center space-x-3">
                        <CompanyLogo company={subscription.company} size="small" />
                        <div>
                          <input
                            type="text"
                            className="input input-sm input-bordered"
                            value={subscription.company}
                            onChange={(e) => handleEditSubscription(index, 'company', e.target.value)}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="input input-sm input-bordered w-24"
                          value={subscription.amount}
                          onChange={(e) => handleEditSubscription(index, 'amount', parseFloat(e.target.value))}
                        />
                        <select
                          className="select select-sm select-bordered"
                          value={subscription.currency}
                          onChange={(e) => handleEditSubscription(index, 'currency', e.target.value)}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CNY">CNY</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <select
                        className="select select-sm select-bordered"
                        value={subscription.billing_cycle}
                        onChange={(e) => handleEditSubscription(index, 'billing_cycle', e.target.value)}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="input input-sm input-bordered"
                        value={subscription.next_billing_date}
                        onChange={(e) => handleEditSubscription(index, 'next_billing_date', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-sm input-bordered"
                        value={subscription.category || ''}
                        onChange={(e) => handleEditSubscription(index, 'category', e.target.value)}
                        placeholder="Category"
                      />
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          // 移除此订阅
                          setSelectedSubscriptions(prev => 
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-between">
            <span className="text-sm text-gray-500">
              {selectedSubscriptions.filter(sub => sub.selected).length} of {selectedSubscriptions.length} selected
            </span>
            <button 
              className="btn btn-primary"
              onClick={handleImportSelected}
              disabled={importMutation.isPending || selectedSubscriptions.filter(sub => sub.selected).length === 0}
            >
              {importMutation.isPending ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : 'Import Selected Subscriptions'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}