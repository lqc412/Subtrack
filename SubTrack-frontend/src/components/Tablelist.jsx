// Enhanced TableList component with sorting functionality
// File: SubTrack-frontend/src/components/Tablelist.jsx

import React, { useState, useEffect, useMemo } from "react";
import { MoreVertical, RefreshCw, AlertCircle, Clock, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import CompanyLogo from "./CompanyLogo";
import api from "../services/api";
import { 
  getSubscriptionStatus, 
  previewSubscriptionUpdates,
  shouldRefreshSubscriptions,
  getDaysUntilBilling
} from "../utils/subscriptionUtils";

export default function TableList({ onOpen, tableData, setTableData, searchTerm }) {
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [previewData, setPreviewData] = useState([]);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'status_priority', // Default sort by status priority (days until billing)
    direction: 'asc' // Ascending = most urgent first
  });

  // Apply auto-update preview to current data
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      const { processedSubscriptions, hasUpdates } = previewSubscriptionUpdates(tableData);
      setPreviewData(processedSubscriptions);
      
      if (hasUpdates) {
        console.log('Detected subscriptions with past due dates - consider refreshing');
      }
    }
  }, [tableData]);

  // Auto-refresh check
  useEffect(() => {
    const shouldRefresh = shouldRefreshSubscriptions(tableData);
    if (shouldRefresh) {
      console.log('Subscriptions may need refresh due to overdue dates');
    }
  }, [tableData]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!previewData || previewData.length === 0) return [];
    
    let filteredData = previewData.filter(
      (item) =>
        (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.amount && String(item.amount).includes(searchTerm))
    );

    return [...filteredData].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'service':
          aValue = a.company?.toLowerCase() || '';
          bValue = b.company?.toLowerCase() || '';
          break;
          
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
          
        case 'billing_cycle':
          // Custom order: daily, weekly, monthly, yearly
          const cycleOrder = { daily: 1, weekly: 2, monthly: 3, yearly: 4 };
          aValue = cycleOrder[a.billing_cycle] || 5;
          bValue = cycleOrder[b.billing_cycle] || 5;
          break;
          
        case 'next_billing_date':
          aValue = new Date(a.next_billing_date);
          bValue = new Date(b.next_billing_date);
          break;
          
        case 'amount':
          aValue = parseFloat(a.amount) || 0;
          bValue = parseFloat(b.amount) || 0;
          break;
          
        case 'status_priority':
          // Sort by days until billing (most urgent first)
          const aDays = getDaysUntilBilling(a.next_billing_date);
          const bDays = getDaysUntilBilling(b.next_billing_date);
          
          // Inactive subscriptions go to the end
          if (!a.is_active && b.is_active) return 1;
          if (a.is_active && !b.is_active) return -1;
          if (!a.is_active && !b.is_active) {
            aValue = a.company?.toLowerCase() || '';
            bValue = b.company?.toLowerCase() || '';
            break;
          }
          
          // For active subscriptions, sort by urgency
          // Overdue (negative days) should come first, then by days ascending
          if (aDays < 0 && bDays >= 0) return -1;
          if (aDays >= 0 && bDays < 0) return 1;
          
          aValue = aDays;
          bValue = bDays;
          break;
          
        default:
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [previewData, searchTerm, sortConfig]);

  // Get sort icon for column headers
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} className="text-primary" /> : 
      <ChevronDown size={14} className="text-primary" />;
  };

  // Column header component
  const SortableHeader = ({ sortKey, children, className = "" }) => (
    <th 
      className={`cursor-pointer hover:bg-base-200 select-none ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {children}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this subscription?");
    if (confirmDelete) {
        try {
            setIsDeleting(true);
            await api.delete(`/subs/${id}`);
            setTableData((prevData) => prevData.filter(item => item.id !== id));
            setError(null);
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.response?.data?.message || "Failed to delete subscription. Please try again.");
            
            if (err.response?.status !== 401) {
                alert("Error deleting subscription: " + (err.response?.data?.message || err.message));
            }
        } finally {
            setIsDeleting(false);
        }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get('/subs');
      setTableData(response.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error("Refresh error:", err);
      setError("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTextClass = (item) => (item.is_active ? "" : "text-gray-400 line-through");

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatBillingCycle = (cycle) => {
    const cycles = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
    };
    return cycles[cycle] || cycle;
  };

  // Render status badge for subscription
  const renderStatusBadge = (subscription) => {
    if (!subscription.is_active) {
      return <span className="badge badge-ghost">Inactive</span>;
    }

    const status = getSubscriptionStatus(subscription);
    
    return (
      <div className="flex items-center gap-2">
        <span className={`badge ${status.badgeClass}`}>
          {status.text}
        </span>
        {subscription.was_updated && (
          <span className="tooltip tooltip-right" data-tip="Date auto-updated">
            <RefreshCw size={14} className="text-blue-500" />
          </span>
        )}
      </div>
    );
  };

  // Check if any subscriptions were auto-updated
  const hasAutoUpdates = previewData.some(item => item.was_updated);

  if (tableData.length === 0 && !error) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error: {error}</span>
        <button className="btn btn-sm" onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-update notification */}
      {hasAutoUpdates && (
        <div className="alert alert-info">
          <RefreshCw size={20} />
          <div>
            <p className="font-medium">Subscription dates automatically updated</p>
            <p className="text-sm">Some subscriptions had overdue dates and have been advanced to the next billing cycle.</p>
          </div>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <span className="loading loading-spinner loading-xs"></span> : 'Sync Changes'}
          </button>
        </div>
      )}

      {/* Sorting info and controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()} | 
          Sorted by: {
            sortConfig.key === 'status_priority' ? 'Urgency' :
            sortConfig.key === 'service' ? 'Service' :
            sortConfig.key === 'category' ? 'Category' :
            sortConfig.key === 'billing_cycle' ? 'Billing Cycle' :
            sortConfig.key === 'next_billing_date' ? 'Next Billing Date' :
            sortConfig.key === 'amount' ? 'Amount' : 'Default'
          } ({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})
        </div>
        <button 
          className="btn btn-sm btn-outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto mt-1">
        {isDeleting && (
          <div className="flex justify-center p-4">
            <span className="loading loading-spinner loading-md"></span>
            <span className="ml-2">Deleting...</span>
          </div>
        )}
        
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>#</th>
              <SortableHeader sortKey="service">Service</SortableHeader>
              <SortableHeader sortKey="category">Category</SortableHeader>
              <SortableHeader sortKey="billing_cycle">Billing Cycle</SortableHeader>
              <SortableHeader sortKey="next_billing_date">Next Billing Date</SortableHeader>
              <SortableHeader sortKey="amount">Amount</SortableHeader>
              <SortableHeader sortKey="status_priority">Status</SortableHeader>
              <th></th>
            </tr>
          </thead>
          <tbody className="hover">
            {sortedData.map((item, index) => {
              const status = getSubscriptionStatus(item);
              
              return (
                <tr key={item.id} className={!item.is_active ? 'opacity-60' : ''}>
                  <th>{index + 1}</th>
                  <td>
                    <div className="flex items-center gap-3">
                      <CompanyLogo company={item.company} size="small" />
                      <div>
                        <span className={getTextClass(item)}>{item.company}</span>
                        {item.was_updated && (
                          <div className="text-xs text-blue-600 flex items-center gap-1">
                            <Clock size={12} />
                            Auto-updated
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getTextClass(item)}>{item.category}</span>
                  </td>
                  <td>
                    <span className={getTextClass(item)}>{formatBillingCycle(item.billing_cycle)}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={getTextClass(item)}>{formatDate(item.next_billing_date)}</span>
                      {status.overdue && (
                        <AlertCircle size={16} className="text-error" title="Was overdue" />
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`font-medium ${getTextClass(item)}`}>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: item.currency,
                      }).format(item.amount)}
                    </span>
                  </td>
                  <td>
                    {renderStatusBadge(item)}
                  </td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-sm btn-circle btn-outline">
                        <MoreVertical size={16} />
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32"
                      >
                        <li>
                          <button className="font-normal text-base-content" onClick={() => onOpen(item)}>
                            Update
                          </button>
                        </li>
                        <li>
                          <button 
                            className="text-error" 
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting}
                          >
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedData.length === 0 && tableData.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No subscriptions match your search.</p>
          </div>
        )}

        <div className="h-20"></div>
      </div>
    </div>
  );
}