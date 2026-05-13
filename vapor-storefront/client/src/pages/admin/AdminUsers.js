import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("https://backend-tender-woodland-6101.fly.dev/admin/users", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Users</h1>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Owned Games</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u.customer_id}>
              <td>{u.display_name}</td>
              <td>{u.email}</td>
              <td>{u.is_admin ? "Yes" : "No"}</td>
              <td>{u.entitlement_count}</td>
              <td>
                <button
                  className="admin-edit-btn"
                  onClick={() => navigate(`/admin/users/${u.customer_id}`)}
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

export default AdminUsers;
