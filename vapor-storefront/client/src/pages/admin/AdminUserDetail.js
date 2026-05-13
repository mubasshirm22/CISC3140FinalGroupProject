import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin.css";

function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [entitlements, setEntitlements] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`https://backend-tender-woodland-6101.fly.dev/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setEntitlements(data.entitlements);
      });
  }, [id]);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">User Details</h1>

      <div className="admin-user-info">
        <p><strong>Name:</strong> {user.display_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Admin:</strong> {user.is_admin ? "Yes" : "No"}</p>
        <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleString()}</p>
      </div>

      <h2>Owned Games</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Game</th>
            <th>Granted At</th>
          </tr>
        </thead>

        <tbody>
          {entitlements.map(e => (
            <tr key={e.entitlement_id}>
              <td><img src={e.image_url} className="admin-product-thumb" /></td>
              <td>{e.name}</td>
              <td>{new Date(e.granted_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="admin-cancel-btn" onClick={() => navigate("/admin/users")}>
        Back
      </button>
    </div>
  );
}

export default AdminUserDetail;
