import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";

function AdminPanel() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export default AdminPanel;
