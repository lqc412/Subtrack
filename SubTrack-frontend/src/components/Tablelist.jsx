import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import CompanyLogo from "./CompanyLogo";
import api from "../services/api";

export default function TableList({ onOpen, tableData, setTableData, searchTerm }) {
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredData = tableData.filter(
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
            // Make sure authorization header is included by using the api instance
            await api.delete(`/subs/${id}`);
            // Update local state after successful delete
            setTableData((prevData) => prevData.filter(item => item.id !== id));
            setError(null);
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.response?.data?.message || "Failed to delete subscription. Please try again.");
            
            // If token expired, the api interceptor will handle redirection to login
            if (err.response?.status !== 401) {
                alert("Error deleting subscription: " + (err.response?.data?.message || err.message));
            }
        } finally {
            setIsDeleting(false);
        }
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
            <th></th>
          </tr>
        </thead>
        <tbody className="hover">
          {filteredData.map((item, index) => (
            <tr key={item.id}>
              <th>{index + 1}</th>
              <td>
                <div className="flex items-center gap-3">
                  <CompanyLogo company={item.company} size="small" />
                  <span className={getTextClass(item)}>{item.company}</span>
                </div>
              </td>
              <td>
                <span className={getTextClass(item)}>{item.category}</span>
              </td>
              <td>
                <span className={getTextClass(item)}>{formatBillingCycle(item.billing_cycle)}</span>
              </td>
              <td>
                <span className={getTextClass(item)}>{formatDate(item.next_billing_date)}</span>
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
          ))}
        </tbody>
      </table>

      <div className="h-20"></div>
    </div>
  );
}