import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { apiUrl } from '../../api';


const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || 'Ошибка входа');
        return;
      }
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      onLoginSuccess();
      navigate('/');
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  const handleSwitchToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="classical-login-bg">
      <div className="classical-login-container">
        <div className="classical-login-title">CLASSICAL</div>
        <form className="classical-login-form" onSubmit={handleSubmit}>
          <input
            className="classical-login-input"
            type="email"
            name="email"
            placeholder="ПОЧТА"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          <input
            className="classical-login-input"
            type="password"
            name="password"
            placeholder="ПАРОЛЬ"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
          
          <button className="classical-login-btn" type="submit">
            ВОЙТИ В АККАУНТ
          </button>
          <button
            type="button"
            className="classical-login-register"
            onClick={handleSwitchToRegister}
          >
            ЗАРЕГИСТРИРОВАТЬСЯ
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
