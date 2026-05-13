import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("https://backend-tender-woodland-6101.fly.dev/admin/orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setOrders(data));
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Orders</h1>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>User</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {orders.map(o => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td>{o.display_name}</td>
              <td>{new Date(o.order_date).toLocaleString()}</td>
              <td>{o.status}</td>
              <td>${Number(o.total_amount).toFixed(2)}</td>
              <td>
                <button
                  className="admin-edit-btn"
                  onClick={() => navigate(`/admin/orders/${o.order_id}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminOrders;
