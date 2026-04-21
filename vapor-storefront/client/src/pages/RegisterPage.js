import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/Auth.css';

/**
 * RegisterPage Component
 * Aligned with backend fields: email, displayName, password.
 */
function RegisterPage() {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    /**
     * Handles user registration
     * Task: Ensure unique email validation and correct field mapping.
     */
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    displayName,
                    password 
                })
            });

            if (response.ok) {
                alert("Registration successful! Please sign in.");
                navigate('/login');
            } else {
                const data = await response.json();
                alert(data.error || "Registration failed. This email might already be taken.");
            }
        } catch (err) {
            console.error("Registration error:", err);
            alert("Server connection failed. Please ensure the backend is running on port 8080.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Create Account</h2>
                <form onSubmit={handleRegister}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            placeholder="example@mail.com"
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="input-group">
                        <label>Display Name</label>
                        <input 
                            type="text" 
                            placeholder="Your public name"
                            onChange={e => setDisplayName(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            placeholder="Min 6 characters"
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="auth-btn">Register</button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;