import { useState } from 'react';
import './App.css';
import Login from './Login';
import Tasks from './Tasks';
import Dashboard from './Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('tasks'); // 'tasks' أو 'dashboard'

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="app-shell">
      {token ? (
        <div>
          <div className="top-bar">
            <button onClick={handleLogout} className="btn btn-danger">
              تسجيل خروج (Sign Out)
            </button>

            <button
              onClick={() => setView(view === 'tasks' ? 'dashboard' : 'tasks')}
              className="btn btn-primary"
            >
              {view === 'tasks' ? 'عرض الداشبورد' : 'عرض المهام'}
            </button>
          </div>

          {view === 'tasks' ? <Tasks /> : <Dashboard />}
        </div>
      ) : (
        <Login onLoginSuccess={() => setToken(localStorage.getItem('token'))} />
      )}
    </div>
  );
}

export default App;