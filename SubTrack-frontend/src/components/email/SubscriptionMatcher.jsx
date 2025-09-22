// src/components/email/SubscriptionMatcher.jsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import CompanyLogo from '../CompanyLogo';
import { 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Calendar,
  Tag,
  RefreshCw,
  Download
} from 'lucide-react';

export default function SubscriptionMatcher({ newSubscriptions, onComplete }) {
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const queryClient = useQueryClient();
  
  // Initialize selected subscriptions when props change
  useEffect(() => {
    if (newSubscriptions && newSubscriptions.length > 0) {
      setSelectedSubscriptions(
        newSubscriptions.map((sub, index) => ({ 
          ...sub, 
          selected: true,
          tempId: `temp_${index}` // Add temporary ID for tracking
        }))
      );
    }
  }, [newSubscriptions]);
  
  // Mutation to import selected subscriptions
  const importMutation = useMutation({
    mutationFn: (subscriptions) => api.post('/subs/batch', { subscriptions }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setMessage({ 
        type: 'success', 
        text: `Successfully imported ${response.data.length} subscription${response.data.length !== 1 ? 's' : ''}!` 
      });
      
      // Call completion handler after short delay to show success message
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    },
    onError: (error) => {
      console.error('Error importing subscriptions:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to import subscriptions. Please try again.' 
      });
    }
  });
  
  // Toggle subscription selection
  const handleToggleSubscription = (index) => {
    setSelectedSubscriptions(prev => {
      const updated = [...prev];
      updated[index].selected = !updated[index].selected;
      return updated;
    });
  };
  
  // Select/deselect all subscriptions
  const handleToggleAll = () => {
    const allSelected = selectedSubscriptions.every(sub => sub.selected);
    setSelectedSubscriptions(prev => 
      prev.map(sub => ({ ...sub, selected: !allSelected }))
    );
  };
  
  // Edit subscription details
  const handleEditSubscription = (index, field, value) => {
    setSelectedSubscriptions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  
  // Remove subscription from list
  const handleRemoveSubscription = (index) => {
    setSelectedSubscriptions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Import selected subscriptions
  const handleImportSelected = async () => {
    const selectedSubs = selectedSubscriptions.filter(sub => sub.selected);
    
    if (selectedSubs.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one subscription to import.' });
      return;
    }
    
    // Clean up subscription data for API
    const cleanedSubs = selectedSubs.map(sub => {
      const { selected, tempId, was_updated, ...cleanSub } = sub;
      return {
        ...cleanSub,
        amount: parseFloat(cleanSub.amount) || 0,
        is_active: cleanSub.is_active !== false // Default to true if not specified
      };
    });
    
    try {
      await importMutation.mutateAsync(cleanedSubs);
    } catch (error) {
      // Error is handled by mutation
    }
  };
  
  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // Get selected count
  const selectedCount = selectedSubscriptions.filter(sub => sub.selected).length;
  
  if (!newSubscriptions || newSubscriptions.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-xl font-semibold mb-2">No Subscriptions Detected</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find any subscription-related emails in your recent inbox. 
            This could happen if:
          </p>
          <ul className="text-left text-sm text-gray-600 mb-6 max-w-md mx-auto space-y-1">
            <li>• Your subscriptions use different email addresses</li>
            <li>• Subscription emails are in a different folder</li>
            <li>• You have newer subscriptions (less than 3 months old)</li>
            <li>• Subscription emails aren't in a recognizable format</li>
          </ul>
          <div className="flex gap-3 justify-center">
            <button 
              className="btn btn-outline"
              onClick={() => onComplete && onComplete()}
            >
              Try Another Email
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                // Navigate to subscriptions page to add manually
                window.location.href = '/subscriptions';
              }}
            >
              Add Manually
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="text-green-500" size={24} />
        <h2 className="text-xl font-semibold">Review Detected Subscriptions</h2>
      </div>
      
      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
          <span>{message.text}</span>
          <button 
            className="btn btn-sm btn-ghost"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          We found <strong>{selectedSubscriptions.length}</strong> potential subscription{selectedSubscriptions.length !== 1 ? 's' : ''} in your emails. 
          Please review the details below and select which ones you'd like to import.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can edit any details before importing. 
            All subscription dates have been set to estimated next billing dates.
          </p>
        </div>
      </div>
      
      {/* Bulk actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="checkbox checkbox-primary" 
              checked={selectedSubscriptions.length > 0 && selectedSubscriptions.every(sub => sub.selected)}
              onChange={handleToggleAll}
            />
            <span className="text-sm font-medium">Select All</span>
          </label>
          
          <span className="text-sm text-gray-500">
            {selectedCount} of {selectedSubscriptions.length} selected
          </span>
        </div>
        
        <div className="text-sm text-gray-500">
          Total monthly cost: {formatCurrency(
            selectedSubscriptions
              .filter(sub => sub.selected)
              .reduce((sum, sub) => {
                const amount = parseFloat(sub.amount) || 0;
                switch (sub.billing_cycle) {
                  case 'yearly': return sum + (amount / 12);
                  case 'weekly': return sum + (amount * 4.33);
                  case 'daily': return sum + (amount * 30.44);
                  default: return sum + amount;
                }
              }, 0)
          )}
        </div>
      </div>
      
      {/* Subscriptions table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="w-12"></th>
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
              <tr 
                key={subscription.tempId || index} 
                className={subscription.selected ? '' : 'opacity-50'}
              >
                <td>
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary" 
                    checked={subscription.selected}
                    onChange={() => handleToggleSubscription(index)}
                  />
                </td>
                
                <td>
                  <div className="flex items-center space-x-3">
                    <CompanyLogo company={subscription.company} size="small" />
                    <div>
                      {editingIndex === index ? (
                        <input
                          type="text"
                          className="input input-sm input-bordered w-32"
                          value={subscription.company}
                          onChange={(e) => handleEditSubscription(index, 'company', e.target.value)}
                          onBlur={() => setEditingIndex(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingIndex(null)}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{subscription.company}</span>
                          {subscription.detected_via_ai && (
                            <span className="badge badge-info badge-sm">AI</span>
                          )}
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setEditingIndex(index)}
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                      {subscription.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {subscription.notes}
                        </div>
                      )}
                      {subscription.source && (
                        <div className="text-[10px] uppercase tracking-wide text-gray-400 mt-1">
                          Source: {subscription.source}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <DollarSign size={14} className="text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        className="input input-sm input-bordered w-20"
                        value={subscription.amount}
                        onChange={(e) => handleEditSubscription(index, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <select
                      className="select select-sm select-bordered"
                      value={subscription.currency}
                      onChange={(e) => handleEditSubscription(index, 'currency', e.target.value)}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CNY">CNY</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </td>
                
                <td>
                  <select
                    className="select select-sm select-bordered"
                    value={subscription.billing_cycle}
                    onChange={(e) => handleEditSubscription(index, 'billing_cycle', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </td>
                
                <td>
                  <div className="flex items-center">
                    <Calendar size={14} className="text-gray-400 mr-2" />
                    <input
                      type="date"
                      className="input input-sm input-bordered"
                      value={formatDateForInput(subscription.next_billing_date)}
                      onChange={(e) => handleEditSubscription(index, 'next_billing_date', e.target.value)}
                    />
                  </div>
                </td>
                
                <td>
                  <div className="flex items-center">
                    <Tag size={14} className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      className="input input-sm input-bordered w-24"
                      value={subscription.category || ''}
                      onChange={(e) => handleEditSubscription(index, 'category', e.target.value)}
                      placeholder="Category"
                    />
                  </div>
                </td>
                
                <td>
                  <button 
                    className="btn btn-sm btn-ghost text-error"
                    onClick={() => handleRemoveSubscription(index)}
                    title="Remove subscription"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Action buttons */}
      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-3">
          <button 
            className="btn btn-outline"
            onClick={() => onComplete && onComplete()}
          >
            Cancel
          </button>
          
          <button 
            className="btn btn-ghost"
            onClick={() => {
              // Reset selections
              setSelectedSubscriptions(prev => 
                prev.map(sub => ({ ...sub, selected: false }))
              );
            }}
          >
            Clear Selections
          </button>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={handleImportSelected}
          disabled={importMutation.isPending || selectedCount === 0}
        >
          {importMutation.isPending ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Importing...
            </>
          ) : (
            <>
              <Download size={16} />
              Import {selectedCount} Subscription{selectedCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}