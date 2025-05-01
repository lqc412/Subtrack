import React from "react";
import { MoreVertical } from "lucide-react";
import CompanyLogo from "./CompanyLogo";

export default function TableList({onOpen}) {
  const items = [
    {
      company: "Google",
      category: "Cloud Storage",
      billingCycle: "monthly",
      nextBillingDate: "2025-05-01",
      amount: 2.99,
      currency: "USD",
      notes: "Google Drive 200GB",
      isActive: true,
    },
    {
      company: "Notion",
      category: "Productivity",
      billingCycle: "monthly",
      nextBillingDate: "2025-05-10",
      amount: 5.0,
      currency: "USD",
      notes: "Notion Pro Plan",
      isActive: false,
    },
    {
      company: "Netflix",
      category: "Entertainment",
      billingCycle: "monthly",
      nextBillingDate: "2025-05-15",
      amount: 15.99,
      currency: "USD",
      notes: "Standard Plan",
      isActive: true,
    },
    {
      company: "Spotify",
      category: "Music",
      billingCycle: "monthly",
      nextBillingDate: "2025-05-22",
      amount: 9.99,
      currency: "USD",
      notes: "Premium Plan",
      isActive: true,
    },
    {
      company: "Adobe",
      category: "Creative",
      billingCycle: "yearly",
      nextBillingDate: "2025-09-15",
      amount: 239.88,
      currency: "USD",
      notes: "Creative Cloud",
      isActive: true,
    },
  ];

  const handleDelete = (item) => {
    console.log("delete:", item);
    // TODO: Open delete confirmation modal or directly call delete logic
  };

  // Get CSS class based on subscription active status
  const getTextClass = (item) =>
    item.isActive ? "" : "text-gray-400 line-through";

  // Format date for better display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format billing cycle for display
  const formatBillingCycle = (cycle) => {
    const cycles = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'yearly': 'Yearly'
    };
    return cycles[cycle] || cycle;
  };

  return (
    <div className="overflow-x-auto mt-1">
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
          {items.map((item, index) => (
            <tr key={index} className={!item.isActive ? "opacity-60" : ""}>
              <th>{index + 1}</th>
              <td>
                <div className="flex items-center gap-3">
                  <CompanyLogo company={item.company} size="small" />
                  <span className={getTextClass(item)}>{item.company}</span>
                </div>
              </td>
              <td className={getTextClass(item)}>{item.category}</td>
              <td className={getTextClass(item)}>{formatBillingCycle(item.billingCycle)}</td>
              <td className={getTextClass(item)}>{formatDate(item.nextBillingDate)}</td>
              <td className={getTextClass(item)}>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: item.currency 
                  }).format(item.amount)}
                </span>
              </td>
              <td>
                {/* Changed dropdown direction from dropdown-left to dropdown-end */}
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-sm btn-circle btn-outline">
                    <MoreVertical size={16} />
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32"
                  >
                    <li>
                      <button onClick={() => onOpen(item)}>Update</button>
                    </li>
                    <li>
                      <button className="text-error" onClick={() => handleDelete(item)}>Delete</button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Added extra space at the bottom to ensure dropdowns have room */}
      <div className="h-20"></div>
    </div>
  );
}


