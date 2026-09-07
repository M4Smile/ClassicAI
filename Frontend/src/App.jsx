import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MainWindow from './components/MainWindow';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsLoginView(true);
  };

  const switchToRegister = () => {
    setIsLoginView(false);
  };

  const switchToLogin = () => {
    setIsLoginView(true);
  };

  if (isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <MainWindow onLogout={handleLogout} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      {isLoginView ? (
        <Login
          onSwitchToRegister={switchToRegister}
          onLogin={handleLogin}
        />
      ) : (
        <Register
          onSwitchToLogin={switchToLogin}
          onRegister={handleRegister}
        />
      )}
    </ThemeProvider>
  );
}

export default App; 