import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/OriginGlobal.css";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8080/admin/products", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8080/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }

      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product.");
    }
  };

  return (
    <div className="origin-products">
      <div className="origin-header-row">
        <h1 className="origin-page-title">Products</h1>
        <button
            className="origin-add-btn"
            onClick={() => navigate("/admin/products/edit/new")}
        >
            + Add Product
        </button>
      </div>

      {loading ? (
        <p>Loading...</p >
      ) : (
        <table className="origin-table">
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
                  <div style={{ width: 54, aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a3c53', background: '#0c1625' }}>
                    <img
                      src={p.image_url}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </td>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>{p.product_id}</td>
                <td>
                  <button
                    className="origin-edit-btn"
                    onClick={() => navigate(`/admin/products/edit/${p.product_id}`)}
                    >
                    Edit
                    </button>
                </td>
                <td>
                  <button
                    className="origin-delete-btn"
                    onClick={() => handleDelete(p.product_id)}
                  >
                    Delete
                  </button>
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