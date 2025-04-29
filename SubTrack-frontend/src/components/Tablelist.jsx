import React from "react";
import { MoreVertical } from "lucide-react"; 

export default function TableList({onOpen}) {
  const items = [
    {
      logo: "",
      compney: "Google",
      category: "Cloud Storage",
      billingCycle: "monthly",
      nextBillingDate: "2025-05-01",
      amount: 2.99,
      currency: "USD",
      notes: "Google Drive 200GB",
      isActive: true,
    },
    {
      logo: "",
      compney: "Notion",
      category: "Productivity",
      billingCycle: "monthly",
      nextBillingDate: "2025-05-10",
      amount: 5.0,
      currency: "USD",
      notes: "Notion Pro Plan",
      isActive: false,
    },
  ];

  const handleEdit = (item) => {
    console.log("edit：", item);
    // TODO: 打开编辑 Modal
  };

  const handleDelete = (item) => {
    console.log("delete：", item);
    // TODO: 打开确认删除弹窗，或直接调用删除逻辑
  };

  const getTextClass = (item) =>
    item.isActive ? "" : "text-gray-400 line-through";

  return (
    <div className="overflow-x-auto mt-1">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>#</th>
            <th>Logo</th>
            <th>Company</th>
            <th>Category</th>
            <th>Billing Cycle</th>
            <th>Next Billing Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody className="hover">
          {items.map((item, index) => (
            <tr key={index}>
              <th>{index + 1}</th>
              <td>
                {item.logo ? (
                  <img src={item.logo} alt={item.compney} className="w-6 h-6" />
                ) : (
                  <span className={`text-gray-400 ${getTextClass(item)}`}>
                    N/A
                  </span>
                )}
              </td>
              <td className={getTextClass(item)}>{item.compney}</td>
              <td className={getTextClass(item)}>{item.category}</td>
              <td className={getTextClass(item)}>{item.billingCycle}</td>
              <td className={getTextClass(item)}>{item.nextBillingDate}</td>
              <td className={getTextClass(item)}>
                {item.currency} {item.amount.toFixed(2)}
              </td>
              <td>
                <div className="dropdown dropdown-left">
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
                      <button onClick={() => handleDelete(item)}>Delete</button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}