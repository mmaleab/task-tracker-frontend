import { useState } from 'react';
import './App.css';
import Login from './Login';
import Tasks from './Tasks';
import Dashboard from './Dashboard';
import Verify from './Verify';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('tasks'); // 'tasks' أو 'dashboard'
  
  // حالة جديدة لتحديد الشاشة الحالية إذا لم يكن المستخدم مسجل دخول (مثل 'login' أو 'verify')
  const [authView, setAuthView] = useState('login'); 
  const [pendingEmail, setPendingEmail] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthView('login');
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
        <div>
          {authView === 'login' && (
            <Login 
              onLoginSuccess={() => setToken(localStorage.getItem('token'))} 
              onGoToVerify={(email) => {
                setPendingEmail(email);
                setAuthView('verify');
              }}
            />
          )}

          {authView === 'verify' && (
            <Verify 
              email={pendingEmail} 
              onVerificationSuccess={() => setAuthView('login')} 
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;