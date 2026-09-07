import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Composer from './pages/Composer';
import Education from './pages/Education';
import Library from './pages/Library';
import Search from './pages/Search';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutMenuOpen, setLogoutMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const logoutRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('token'))
  );

  // Функция для установки состояния аутентификации
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setLogoutMenuOpen(false);
  };

  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      // Закрытие основного меню
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        event.target !== buttonRef.current
      ) {
        setMenuOpen(false);
        buttonRef.current?.blur();
      }

      // Закрытие меню выхода
      if (
        logoutMenuOpen &&
        logoutRef.current &&
        !logoutRef.current.contains(event.target)
      ) {
        setLogoutMenuOpen(false);
      }
    }

    if (menuOpen || logoutMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, logoutMenuOpen]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
        <Route path="/register" element={<Register onRegisterSuccess={handleLogin} />} />
        {isAuthenticated ? (
          <Route
            path="/*"
            element={
              <div className="app-container">
                <button
                  ref={buttonRef}
                  onClick={() => {
                    setMenuOpen((open) => {
                      if (open) buttonRef.current?.blur();
                      return !open;
                    });
                  }}
                  className={`menu-button ${menuOpen ? 'active' : ''}`}
                  aria-label="Открыть меню"
                  aria-expanded={menuOpen}
                  style={{ position: 'fixed', top: 16, left: 16, zIndex: 2001 }}
                >
                  ☰
                </button>

                {/* Кнопка профиля и выхода */}
                <div className="profile-menu" ref={logoutRef}>
                  <button
                    className="profile-button"
                    onClick={() => setLogoutMenuOpen(!logoutMenuOpen)}
                    aria-label="Меню профиля"
                    style={{ boxShadow: 'none' }}
                  >
                    <img src="/images/avatar.jpg" alt="profile" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover' }} />
                  </button>
                  {logoutMenuOpen && (
                    <div className="logout-menu">
                      <button onClick={handleLogout} className="logout-button">
                        Выйти из аккаунта
                      </button>
                    </div>
                  )}
                </div>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="side-nav-menu floating"
                    role="menu"
                    style={{
                      position: 'absolute',
                      top: menuPos.top,
                      left: menuPos.left,
                      width: menuPos.width,
                      zIndex: 2000,
                    }}
                  >
                    <Navigation onNavigate={() => setMenuOpen(false)} />
                  </div>
                )}

                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/composer" element={<Composer />} />
                    <Route path="/education" element={<Education />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/search" element={<Search />} />
                  </Routes>
                </main>
              </div>
            }
          />
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}
