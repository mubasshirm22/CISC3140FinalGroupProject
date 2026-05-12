import React from "react";
import { Link } from "react-router-dom";
import "./admin.css";

function AdminLayout({ children }) {
  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2 className="admin-title">ADMIN</h2>

        <nav className="admin-nav">
          <Link to="/admin/products" className="admin-link">Products</Link>
          <Link to="/admin/orders" className="admin-link">Orders</Link>
          <Link to="/admin/users" className="admin-link">Users</Link>
        </nav>
      </aside>

      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
