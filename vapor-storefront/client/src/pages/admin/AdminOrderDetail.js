import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin.css";

function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`https://backend-tender-woodland-6101.fly.dev/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setOrder(data.order);
        setItems(data.items);
      });
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Order Details</h1>

      <div className="admin-order-info">
        <p><strong>Order ID:</strong> {order.order_id}</p>
        <p><strong>User:</strong> {order.display_name}</p>
        <p><strong>Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> ${Number(order.total_amount).toFixed(2)}</p>
      </div>

      <h2>Items</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>

        <tbody>
          {items.map(i => (
            <tr key={i.order_item_id}>
              <td><img src={i.image_url} className="admin-product-thumb" /></td>
              <td>{i.name}</td>
              <td>${Number(i.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="admin-cancel-btn" onClick={() => navigate("/admin/orders")}>
        Back
      </button>
    </div>
  );
}

export default AdminOrderDetail;
