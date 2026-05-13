import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("https://backend-tender-woodland-6101.fly.dev/admin/products", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      console.log("ADMIN PRODUCTS RESPONSE:", data);

      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  return (
    <div className="admin-products">
      <div className="admin-header-row">
        <h1 className="admin-page-title">Products</h1>
        <button
            className="admin-add-btn"
            onClick={() => navigate("/admin/products/edit/new")}
        >
            + Add Product
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>ID</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.product_id}>
                <td>
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="admin-product-thumb"
                  />
                </td>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>{p.product_id}</td>
                <td>
                  <button
                    className="admin-edit-btn"
                    onClick={() => navigate(`/admin/products/edit/${p.product_id}`)}
                    >
                    Edit
                    </button>
                </td>
                <td>
                  <button className="admin-delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminProducts;
