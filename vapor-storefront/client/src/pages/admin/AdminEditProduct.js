import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin.css";

function AdminEditProduct() {
  const { id } = useParams(); // "new" or product_id
  const navigate = useNavigate();

  const isNew = id === "new";

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    image_url: ""
  });

  const openUploadWidget = () => {
  window.cloudinary.openUploadWidget(
    {
      cloudName: "dswxezumx",
      uploadPreset: "ml_default",
      sources: ["local", "url", "camera"],
      multiple: false,
      cropping: false
    },
    (error, result) => {
      if (!error && result && result.event === "success") {
        setForm({ ...form, image_url: result.info.secure_url });
      }
    }
  );
};

  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:8080/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setForm(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load product:", err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    const method = isNew ? "POST" : "PUT";
    const url = isNew
      ? "http://localhost:8080/admin/products"
      : `http://localhost:8080/admin/products/${id}`;

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    navigate("/admin/products");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-editor">
      <h1 className="admin-page-title">
        {isNew ? "Add New Product" : "Edit Product"}
      </h1>

      <div className="admin-form">
        <label>Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <label>Price</label>
        <input
          name="price"
          value={form.price}
          onChange={handleChange}
        />

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />

        <label>Image URL</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
        />

        <button
          type="button"
          className="admin-upload-btn"
          onClick={openUploadWidget}
        >
          Upload Image
        </button>

        <img
          src={form.image_url}
          alt=""
          className="admin-editor-preview"
        />

        <button className="admin-save-btn" onClick={handleSave}>
          Save
        </button>

        <button className="admin-cancel-btn" onClick={() => navigate("/admin/products")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AdminEditProduct;
