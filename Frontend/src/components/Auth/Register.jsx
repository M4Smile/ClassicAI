import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { apiUrl } from '../../api';

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
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
    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    try {
      const response = await fetch(apiUrl('/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || 'Ошибка регистрации');
        return;
      }
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      onRegisterSuccess();
      navigate('/');
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="classical-login-bg">
      <div className="classical-login-container">
        <div className="classical-login-title">CLASSICAL</div>
        <form className="classical-login-form" onSubmit={handleSubmit}>
          <input
            className="classical-login-input"
            type="email"
            name="name"
            placeholder="ИМЯ"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />
          <input
            className="classical-login-input"
            type="text"
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
            autoComplete="new-password"
            required
          />
          <input
            className="classical-login-input"
            type="password"
            name="confirmPassword"
            placeholder="ПОДТВЕРДИТЕ ПАРОЛЬ"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
          <button className="classical-login-btn" type="submit">
            ЗАРЕГИСТРИРОВАТЬСЯ
          </button>
          <button
            type="button"
            className="classical-login-register"
            onClick={handleSwitchToLogin}
          >
            УЖЕ ЕСТЬ АККАУНТ? ВОЙТИ
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
