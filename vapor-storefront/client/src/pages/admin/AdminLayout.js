import React from "react";
import { Link } from "react-router-dom";
import "../../style/OriginGlobal.css";

function AdminLayout({ children }) {
  return (
    <div className="origin-container">
      <aside className="origin-sidebar">
        <h2 className="origin-title">Admin Panel</h2>

        <nav className="origin-nav">
          <Link to="/admin/products" className="origin-link">Products</Link>
          <Link to="/admin/orders" className="origin-link">Orders</Link>
          <Link to="/admin/users" className="origin-link">Users</Link>
        </nav>
      </aside>

      <main className="origin-content">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
