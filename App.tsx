
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import UserSelection from './components/UserSelection';
import ColoringView from './components/ColoringView';
import GameMenu from './components/GameMenu';
import { User, USERS } from './constants';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('collabo-color-user');
    if (storedUser) {
      const foundUser = USERS.find(u => u.id === storedUser);
      if (foundUser) {
        setUser(foundUser);
        // Не перенаправляем сразу, пусть пользователь сам выберет игру
      }
    }
  }, []);

  const handleUserSelect = (selectedUser: User) => {
    localStorage.setItem('collabo-color-user', selectedUser.id);
    setUser(selectedUser);
    navigate('/games');
  };

  const handleBackToAuth = () => {
    localStorage.removeItem('collabo-color-user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="h-screen w-screen">
      <Routes>
        <Route path="/" element={<UserSelection onUserSelect={handleUserSelect} />} />
        <Route path="/games" element={<GameMenu />} />
        <Route path="/coloring" element={user ? <ColoringView user={user} onBackToAuth={handleBackToAuth} /> : <UserSelection onUserSelect={handleUserSelect} />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;