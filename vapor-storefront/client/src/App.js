import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import HomePage from './pages/homepage';
import GameDetailPage from './pages/GameDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import LibraryPage from './pages/LibraryPage'

import AdminPanel from './pages/AdminPanel';
import AdminProducts from "./pages/admin/AdminProducts";
import AdminEditProduct from "./pages/admin/AdminEditProduct";
import AdminOrders from "./pages/admin/AdminOrders"
import AdminOrderDetail from "./pages/admin/AdminOrderDetail"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminUserDetail from "./pages/admin/AdminUserDetail"

import './style/App.css';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/library" element={<LibraryPage />} />


        <Route path="/admin" element={<AdminPanel />}>
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/edit/:id" element={<AdminEditProduct />} />

          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />

          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;