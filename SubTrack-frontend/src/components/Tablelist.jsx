// Enhanced TableList component with auto-update support
// File: SubTrack-frontend/src/components/Tablelist.jsx

import React, { useState, useEffect } from "react";
import { MoreVertical, RefreshCw, AlertCircle, Clock } from "lucide-react";
import CompanyLogo from "./CompanyLogo";
import api from "../services/api";
import { 
  getSubscriptionStatus, 
  previewSubscriptionUpdates,
  shouldRefreshSubscriptions 
} from "../utils/subscriptionUtils";

export default function TableList({ onOpen, tableData, setTableData, searchTerm }) {
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [previewData, setPreviewData] = useState([]);

  // Apply auto-update preview to current data
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      const { processedSubscriptions, hasUpdates } = previewSubscriptionUpdates(tableData);
      setPreviewData(processedSubscriptions);
      
      // If we detect updates needed, show a subtle indicator
      if (hasUpdates) {
        console.log('Detected subscriptions with past due dates - consider refreshing');
      }
    }
  }, [tableData]);

  // Auto-refresh check
  useEffect(() => {
    const shouldRefresh = shouldRefreshSubscriptions(tableData);
    if (shouldRefresh) {
      // Could trigger an automatic refresh here if desired
      console.log('Subscriptions may need refresh due to overdue dates');
    }
  }, [tableData]);

  const filteredData = previewData.filter(
    (item) =>
      (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.amount && String(item.amount).includes(searchTerm))
  );

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this subscription?");
    if (confirmDelete) {
        try {
            setIsDeleting(true);
            await api.delete(`/subs/${id}`);
            // Update local state after successful delete
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

      {/* Refresh controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
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
              <th>Service</th>
              <th>Category</th>
              <th>Billing Cycle</th>
              <th>Next Billing Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="hover">
            {filteredData.map((item, index) => {
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

        {filteredData.length === 0 && tableData.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No subscriptions match your search.</p>
          </div>
        )}

        <div className="h-20"></div>
      </div>
    </div>
  );
}