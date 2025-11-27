import React, { useState, useEffect } from 'react';
import './index.css';
import './app.css';
import './styles/responsive.css';
import './styles/variables.css';
import Login from './components/Login';
import RegistrationModal from './components/RegistrationModal';
import Dashboard from './components/Dashboard';
import Loader from './components/shared/Loader';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    api.auth.checkSession()
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Not logged in
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <Loader fullscreen text="Loading..." />;
  }

  return (
    <div className="App">
      {!user ? (
        <>
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onOpenRegistration={() => setShowRegistration(true)}
          />
          <RegistrationModal 
            isOpen={showRegistration}
            onClose={() => setShowRegistration(false)}
          />
        </>
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
